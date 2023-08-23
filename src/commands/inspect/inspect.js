const inputUtil = require('../../shared/inputUtil');
const { fromSSO } = require("@aws-sdk/credential-provider-sso");

const { SFNClient, ListStateMachinesCommand, ListExecutionsCommand, DescribeExecutionCommand, GetExecutionHistoryCommand } = require('@aws-sdk/client-sfn');
const colorize = require('json-colorizer');
const fs = require('fs');
const ini = require('ini');
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
  const stepFunctions = new SFNClient({ credentials, region: cmd.region });
  let token;
  const stateMachines = [];
  do {
    const stateMachinesResponse = await stepFunctions.send(new ListStateMachinesCommand({ nextToken: token }));
    token = stateMachinesResponse.nextToken;
    stateMachines.push(...stateMachinesResponse.stateMachines.filter(f => f.type === "STANDARD" && f.name.toLowerCase().startsWith(cmd.namePrefix.toLowerCase())).map(p => { return { name: p.name, value: p.stateMachineArn } }));
  } while (token);
  let executions;
  do {
    const stateMachineArn = await inputUtil.autocomplete("Select state machine", stateMachines);
    executions = await stepFunctions.send(new ListExecutionsCommand({ stateMachineArn, statusFilter: cmd.statusFilter }));
    if (!executions.executions.length) {
      console.log("No executions found");
    } else {
      break;
    }
  } while (true);
  let continueAction;

  do {
    continueAction = null;
    const executionArn = await inputUtil.autocomplete("Select execution", executions.executions.map(p => {
      return { name: `${getStatusSymbol(p)} ${p.name}`, value: p.executionArn }
    }));

    const execution = await stepFunctions.send(new DescribeExecutionCommand({ executionArn }));

    const action = await inputUtil.autocomplete("Select action", ["View input", "View output", "View execution history"]);

    switch (action) {
      case "View input":
        console.log(colorize(JSON.stringify(JSON.parse(execution.input), null, 2) || {}));
        continueAction = await inputUtil.list("Continue?", ["Back to state machine", "Exit"]);
        break;
      case "View output":
        console.log(colorize(JSON.stringify(JSON.parse(execution.output), null, 2) || {}));
        continueAction = await inputUtil.list("Continue?", ["Back to state machine", "Exit"]);
        break;
      case "View execution history":
        let token;
        const items = [];
        const idNameMap = {};
        do {
          const historyResponse = await stepFunctions.send(new GetExecutionHistoryCommand({ executionArn, nextToken: token }));
          token = historyResponse.nextToken;
          items.push(...historyResponse.events.map(p => {
            if (p["stateEnteredEventDetails"]) {
              idNameMap[p.id] = { name: p["stateEnteredEventDetails"].name };
            } else {
              idNameMap[p.id] = idNameMap[p.previousEventId] ? idNameMap[p.previousEventId] : { name: null };
            }
            if (p["taskScheduledEventDetails"]) {
              idNameMap[p.id].type = p["taskScheduledEventDetails"].resourceType;
            }

            let name = `${p.timestamp.toISOString()} ${getTaskStatusSymbol(p)}${p.type}`;
            if (idNameMap[p.id].name) {
              name += ` >> ${idNameMap[p.id].name}`;
            }
            if (idNameMap[p.id].type) {
              name += ` (${idNameMap[p.id].type})`;
            }
            return {
              name: name, value: p
            }
          }));
        } while (token);
        do {
          const item = await inputUtil.autocomplete("Select history item", items);
          const eventDetailsKey = Object.keys(item).find(p => p.endsWith("EventDetails"));
          if (eventDetailsKey) {
            if (typeof item[eventDetailsKey].input === "string") {
              item[eventDetailsKey].input = JSON.parse(item[eventDetailsKey].input || "{}");
              item[eventDetailsKey].output = JSON.parse(item[eventDetailsKey].output || "{}");
              if (item[eventDetailsKey].cause) {
                try {
                  item[eventDetailsKey].cause = JSON.parse(item[eventDetailsKey].cause);
                } catch (ex) {

                }
              }
            }
          }
          console.log(colorize(JSON.stringify(item, null, 2)));
          continueAction = await inputUtil.list("Continue?", ["Back to execution", "Back to state machine", "Exit"]);
        } while (continueAction === "Back to execution");
    }
  } while (continueAction === "Back to state machine");
}

function getTaskStatusSymbol(task) {
  if (task.type.includes("Failed")) {
    return "❌";
  } else if (task.type.includes("Succeeded")) {
    return "✅";
  } else if (task.type.includes("TimedOut")) {
    return "⏲";
  }

  return "✅";
}

function getStatusSymbol(execution) {
  switch (execution.status) {
    case "RUNNING":
      return "⏳";
    case "SUCCEEDED":
      return "✅";
    case "FAILED":
      return "❌";
    case "TIMED_OUT":
      return "⏲";
    case "ABORTED":
      return "🚫";
    default:
      return "❓";
  }
}

module.exports = {
  run
}