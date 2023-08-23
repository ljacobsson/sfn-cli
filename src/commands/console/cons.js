const { CloudFormationClient, DescribeStackResourcesCommand } = require("@aws-sdk/client-cloudformation");
const { fromSSO } = require("@aws-sdk/credential-provider-sso");

const inputUtil = require('../../shared/inputUtil');
const parser = require("../../shared/parser");
const fs = require("fs");
const ini = require('ini');
const link2aws = require('link2aws');
const open = import('open');
async function run(cmd) {
  let region;
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
      region = params.region;
    }
  }
  if (!cmd.stackName) {
    console.error("Missing required option: --stack-name");
    process.exit(1);
  }
  const credentials = await fromSSO({ profile: cmd.profile || "default" });
  const cloudFormation = new CloudFormationClient({ credentials, region });

  const templateFile = cmd.templateFile;
  if (!fs.existsSync(templateFile)) {
    console.log(`File ${templateFile} does not exist`);
    return;
  }
  const template = parser.parse("yaml", fs.readFileSync(templateFile, "utf8"));

  const stateMachines = Object.keys(template.Resources).filter(key => template.Resources[key].Type === "AWS::Serverless::StateMachine");
  if (stateMachines.length === 0) {
    console.log("No state machines found in template");
    return;
  }
  let stateMachine;
  if (stateMachines.length === 1) {
    stateMachine = stateMachines[0];
  }
  else {
    const choices = stateMachines.map((sm, i) => sm);
    stateMachine = await inputUtil.autocomplete("Select a state machine", choices);
  }

  const physicalId = await getPhysicalId(cloudFormation, cmd.stackName, stateMachine);

  (await (open)).default(new link2aws.ARN(physicalId).consoleLink);
}

async function getPhysicalId(cloudFormation, stackName, logicalId) {
  const response = await cloudFormation.send(new DescribeStackResourcesCommand({
    StackName: stackName,
    LogicalResourceId: logicalId
  }));
  if (response.StackResources.length === 0) {
    throw new Error(`No stack resource found for ${logicalId}`);
  }
  return response.StackResources[0].PhysicalResourceId;
}

module.exports = {
  run
};
