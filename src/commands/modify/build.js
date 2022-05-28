const parser = require("../../shared/parser");
const fs = require("fs");
const inputUtil = require("../../shared/inputUtil");
const jp = require('jsonpath');
const stateBuilder = require("../../states/stateBuilder");
const knownStates = [];
async function run(cmd) {
  const definitionFile = cmd.definitionFile;
  if (!fs.existsSync(definitionFile)) {
    const create = await inputUtil.prompt(`File ${definitionFile} does not exist. Do you want to create it?`);
    if (!create) {
      return;
    }
    console.log("Please create your first state");
    const firstState = await stateBuilder.build();

    const aslSkeleton = {
      StartAt: firstState.stateName,
      States: {
        [firstState.stateName]: firstState.asl
      }
    }
    fs.writeFileSync(definitionFile, parser.stringify("yaml", aslSkeleton));
  }
  while (true) {
    const asl = parser.parse("asl", fs.readFileSync(definitionFile, "utf8"));
    let tree = {};
    tree = generateTree(asl.States, asl.StartAt, tree, "$");
    tree.open = true;
    const state = await inputUtil.tree("Select a state", [tree, {
      name: "Exit",
      value: "exit"
    }]);

    if (state === "exit") {
      return;
    }
    const result = jp.query(asl.States, state);
    if (result.length) {
      await stateActions(result, asl, state, definitionFile);
    }
  }
}

async function stateActions(result, asl, state, definitionFile) {
  const options = ["View ASL snippet"];
  if (result[0].End) {
    options.push("Add next state");
  }
  if (result[0].Type === "Parallel") {
    options.push("Add parallel state");
  }
  const choice = await inputUtil.autocomplete("Select action",
    options
  );

  if (choice === "View ASL snippet") {
    console.log(parser.renderPretty("asl", result[0]));
  }
  if (choice === "Add next state") {
    const newState = await stateBuilder.build();
    if (!newState) {
      return;
    }
    result[0].Next = newState.stateName;
    delete result[0].End;
    const parent = jp.parent(asl.States, state);
    parent[newState.stateName] = newState.asl;
    parent[newState.stateName].End = true;
    fs.writeFileSync(definitionFile, parser.stringify("asl", asl));
  }
  if (choice === "Add parallel state") {
    const newState = await stateBuilder.build();
    if (!newState) {
      return;
    }
    newState.asl.End = true;
    result[0].Branches.push({
      StartAt: newState.stateName,
      States: {
        [newState.stateName]: newState.asl
      }
    })
    fs.writeFileSync(definitionFile, parser.stringify("asl", asl));
  }
}

function generateTree(obj, state, tree, path) {
  const newPath = expandPath(path, [`'${state}'`]);
  const item = {
    name: `${state} [${obj[state].Type}]`,
    value: newPath
  }
  if (knownStates.includes(newPath)) {
    item.name += " (recursive)";
    return item;
  }
  knownStates[newPath] = true;

  if (obj[state].Resource) {
    if (obj[state].Resource.startsWith("arn:")) {
      const split = obj[state].Resource.split(":");
      let offset = 5;
      if (split[5] === "aws-sdk") {
        offset = 6;
      }
      item.name += ` (${split[offset]}:${split[offset + 1]})`;
    }
  }

  if (obj[state].Choices) {
    for (const choice of obj[state].Choices) {
      if (choice.Next) {
        item.children = item.children || [];
        item.children.push(generateTree(obj, choice.Next, tree, path));
      }
    }
    if (obj[state].Default) {
      item.children = item.children || [];
      item.children.push(generateTree(obj, obj[state].Default, tree, path));
    }
  }
  if (obj[state].Iterator) {
    item.children = item.children || [];
    item.children.push(generateTree(obj[state].Iterator.States, obj[state].Iterator.StartAt, tree, expandPath(path, [`'${state}'`, "'Iterator'", "'States'"])));
  }

  if (obj[state].Branches) {
    for (const branch of obj[state].Branches) {
      item.children = item.children || [];
      item.children.push(generateTree(branch.States, branch.StartAt, tree, expandPath(path, [`'${state}'`, "'Branches'", "*", "'States'"])));
    }
  }

  if (obj[state].Next) {
    item.children = item.children || [];
    item.children.push(generateTree(obj, obj[state].Next, tree, path));
  }
  return item;
}

module.exports = {
  run
};

function expandPath(path, parts) {
  return `${path}${parts.map(p => (`[${p}]`)).join("")}`;
}
