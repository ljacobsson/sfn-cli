const fs = require('fs-extra');
const parser = require("../../shared/parser");
const eventSources = require("./event-sources.json");

async function run(cmd) {
  let template = {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Transform": "AWS::Serverless-2016-10-31",
    "Resources": {
    }
  }
  const exists = fs.existsSync(cmd.templateFile);
  if (exists) {
    template = parser.parse("yaml", fs.readFileSync(cmd.templateFile, "utf8"));
  }
  let event;
  try {
    event = eventSources[cmd.eventSource.toLowerCase()];
  } catch {
    console.log("Invalid event source. Valid event sources are: eventbridge, api and schedule");
    return;
  }
  const resource = {
    "Type": "AWS::Serverless::StateMachine",
    "Properties": {
      "Name":
        { "Fn::Sub": "${AWS::StackName}-StateMachine" },
      "DefinitionUri": "statemachine.yaml"
    }
  }
  if (event) {
    resource.Properties.Events = event
  }
  let name = cmd.logicalId;
  if (template.Resources[name]) {
    let i = 1;
    while (template.Resources[name + i]) {
      i++;
    }
    name = name + i;
  }
  template.Resources[name] = resource;
  const stateMachineDefinition = {
    "StartAt": "StartState",
    "States": {
      "StartState": {
        "Type": "Pass",
        "End": true
      }
    }
  }

  fs.outputFileSync(cmd.templateFile, parser.stringify("yaml", template));
  let aslFileName = cmd.aslFile;
  if (fs.existsSync(aslFileName)) {
    let i = 1;
    while(fs.existsSync(aslFileName + i)) {
      i++;
    }
    aslFileName = aslFileName + i;
  }

  fs.outputFileSync(aslFileName, parser.stringify("yaml", stateMachineDefinition));
}
module.exports = {
  run
}