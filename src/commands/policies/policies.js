const fs = require('fs-extra');
const parser = require("../../shared/parser");

async function run(cmd) {
  const exists = fs.existsSync(cmd.templateFile);
  if (exists) {
    template = parser.parse("template", fs.readFileSync(cmd.templateFile, "utf8"));
  } else {
    console.log("Template file does not exist");
    return;
  }

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

  const aslFile = template.Resources[stateMachine].Properties.DefinitionUri;
  if (!fs.existsSync(aslFile)) {
    console.log(`File ${aslFile} does not exist`);
    return;
  }

  const asl = fs.readFileSync(aslFile, "utf8");

  const matches = asl.match(/arn:aws:states(.+?)\n/g).map(match => match.replace(/\n/g, ''));
  if (!matches) {
    console.log("No SDK actions found in ASL");
    return;
  }
  // split by : and get last 2 elements
  let actions = matches.map(match => match.split(':').slice(-2));
  template.Resources[stateMachine].Properties.Policies =
    template.Resources[stateMachine].Properties.Policies || [];
  const policy = {
    Version: "2012-10-17",
    Statement: []
  };

  for (const action of actions) {
    const service = action[0];
    const actionName = action[1];
    const upperAction = upperCaseFirst(actionName);
    if (policy.Statement.find(statement => statement.Action[0] === `${service}:${upperAction}`)) {
      continue;
    }
    const actionString = `${service}:${upperAction}`;
    const statement = {
      "Sid": service,
      "Effect": "Allow",
      "Action": [
        actionString
      ],
      "Resource": "<arn>"
    };
    if (policy.Statement.find(statement => statement.Sid === service)) {
      policy.Statement.find(statement => statement.Sid === service).Action.push(actionString);
      continue;
    } else {
      policy.Statement.push(statement);
    }
  }
  template.Resources[stateMachine].Properties.Policies.push(policy);
  fs.writeFileSync(cmd.templateFile, parser.stringify("template", template));

}

function upperCaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
module.exports = {
  run
}