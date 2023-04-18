const StepFunctions = require("aws-sdk/clients/stepfunctions");
const CloudFormation = require("aws-sdk/clients/cloudformation");
const AWS = require("aws-sdk");
const inputUtil = require('../../shared/inputUtil');
const parser = require("../../shared/parser");
const jp = require('jsonpath');
const fs = require("fs");
const readline = require('readline');
const authHelper = require('../../shared/auth-helper');
const ini = require('ini');
async function run(cmd) {
  if (fs.existsSync("samconfig.toml")) {
    const config = ini.parse(fs.readFileSync("samconfig.toml", "utf8"));
    const params = config?.default?.deploy?.parameters;
    if (params.stack_name) {
      console.log("Using stack name from config:", params.stack_name);
      cmd.stackName = params.stack_name;
    }
    if (params.profile) {
      console.log("Using AWS profile from config:", params.profile);
      cmd.profile = params.profile;
    }
    if (params.region) {
      console.log("Using AWS region from config:", params.region);
      cmd.region = params.region;
      AWS.config.region = params.region;
    }
  }
  if (!cmd.stackName) {
    console.error("Missing required option: --stack-name");
    process.exit(1);
  }

  authHelper.initAuth(cmd)
  
  const stepFunctions = new StepFunctions();
  const cloudFormation = new CloudFormation();
  
  const templateFile = cmd.templateFile;
  if (!fs.existsSync(templateFile)) {
    console.log(`File ${templateFile} does not exist`);
    return;
  }
  const template = parser.parse("yaml", fs.readFileSync(templateFile, "utf8"));
  const stateMachineNames = Object.keys(template.Resources).filter(key => template.Resources[key].Type === "AWS::Serverless::StateMachine");
  let stateMachine;
  if (stateMachineNames.length === 0) {
    console.log("No state machines found in template.");
    return;
  } else if (stateMachineNames.length === 1) {
    stateMachine = stateMachineNames[0]
  } else {
    stateMachine = await inputUtil.list("Select a state machine", stateMachineNames);
  }
  
  const stack = await cloudFormation.listStackResources({ StackName: cmd.stackName }).promise();
  const stateMachineArn = stack.StackResourceSummaries.find(resource => resource.LogicalResourceId === stateMachine).PhysicalResourceId;
  const stateMachineResponse = await stepFunctions.describeStateMachine({ stateMachineArn }).promise();
  const definition = JSON.parse(stateMachineResponse.definition);
  const aslFilePath = template.Resources[stateMachine].Properties.DefinitionUri;
  let aslDocument = parser.parse("yaml", fs.readFileSync(aslFilePath).toString('utf8'), null, 2) || aslDocument;
  const substitutionPaths = getSubstitutionPaths(aslDocument);
  const substitutionMap = [];
  for (const substitutionPath of substitutionPaths) {
    const subKey = jp.value(aslDocument, substitutionPath);
    const value = jp.value(definition, substitutionPath);
    if (!value) {
      console.log(`No value found for ${substitutionPath} in StateMachine ASL. If the JSON path has changed locally, please do a full infra deploy.`);
      return;
    }
    substitutionMap.push({ key: subKey, value: value });
  }

  fs.watchFile(aslFilePath, async () => {
    console.log("\nDetected change in ASL file. Syncing...");
    aslDocument = parser.parse("yaml", fs.readFileSync(aslFilePath).toString('utf8'), null, 2) || aslDocument;
    let aslString = JSON.stringify(aslDocument);
    for (const substitution of substitutionMap) {
      aslString = replaceAll(aslString, substitution.key, substitution.value);
    }
    const unmatchedSubstitutions = getSubstitutionPaths(JSON.parse(aslString));
    if (unmatchedSubstitutions.length > 0) {
      console.log(`The following substitutions could not be found in the StateMachine ASL: ${unmatchedSubstitutions.map(p => jp.value(aslDocument, p)).join(", ")}`);
      return;
    }
    aslDocument = JSON.parse(aslString);
    try {
      const stateMachine = await stepFunctions.describeStateMachine({ stateMachineArn }).promise();
      const result = await stepFunctions.updateStateMachine({ stateMachineArn, definition: JSON.stringify(aslDocument), roleArn: stateMachine.roleArn }).promise();
      console.log("State machine updated successfully");
    } catch (e) {
      console.log(e.message);
    }
  });
  await wait("Cloud sync is running. CTRL+C / Command+. to quit.\n");
}
function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}
function getSubstitutionPaths(doc) {
  const paths = [];
  const getPath = (currPath, item) => {
    if (Array.isArray(item)) {
      item.forEach((el, idx) => getPath(`${currPath}.${idx}`, el));
    } else if (typeof item == "object") {
      Object.entries(item || {}).forEach(([key, value]) => {
        if (key.includes(" ")) key = `["${key}"]`;
        else key = `.${key}`;
        getPath(`${currPath}${key}`, value);
        if (typeof value === "string" && value.includes("${")) {
          paths.push(`$.${currPath}${key}`);
        }
      });
    }
  };
  Object.entries(doc).forEach(([key, value]) => {
    getPath(key, value);
  });
  return paths;
}

function wait(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}



module.exports = {
  run
};
