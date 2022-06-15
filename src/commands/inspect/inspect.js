const inputUtil = require('../../shared/inputUtil');
const AWS = require('aws-sdk');
const colorize = require('json-colorizer');
const authHelper = require('../../shared/auth-helper');

async function run(cmd) {
  authHelper.initAuth(cmd)
  const stepFunctions = new AWS.StepFunctions();
  let token;
  const stateMachines = [];
  do {
    const stateMachinesResponse = await stepFunctions.listStateMachines({ nextToken: token }).promise();
    token = stateMachinesResponse.nextToken;
    stateMachines.push(...stateMachinesResponse.stateMachines.filter(f => f.type === "STANDARD" && f.name.toLowerCase().startsWith(cmd.namePrefix.toLowerCase())).map(p => { return { name: p.name, value: p.stateMachineArn } }));
  } while (token);
  let executions;
  do {
    const stateMachineArn = await inputUtil.autocomplete("Select state machine", stateMachines);
    executions = await stepFunctions.listExecutions({ stateMachineArn, statusFilter: cmd.statusFilter }).promise();
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

    const execution = await stepFunctions.describeExecution({ executionArn }).promise();

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
          const historyResponse = await stepFunctions.getExecutionHistory({ executionArn, nextToken: token }).promise();
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