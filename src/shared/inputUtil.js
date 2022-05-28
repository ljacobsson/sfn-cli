const inquirer = require("inquirer");
const TreePrompt = require('inquirer-tree-prompt');

inquirer.registerPrompt('tree', TreePrompt);
inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);
async function choices(message, items, type, defaults, pageSize = 5) {
  return (
    await inquirer.prompt({
      type: type,
      name: "item",
      choices: items,
      message: message,
      default: defaults,
      pageSize: pageSize,
      source: function (answersYet, input) {
        
        if (!input) {
          return items;
        }
        const split = input.split(" ");
        const filter = items.filter(
          (p) =>
            !p.name ||
            split.filter((f) => p.name.toLowerCase().includes(f.toLowerCase()))
              .length === split.length
        );
        return filter;
      },
    })
  ).item;
}

async function tree(message, items) {
  return (await inquirer
    .prompt(
      {
        type: 'tree',
        name: "state",
        message: message,
        tree: items
      })).state;
}

async function files(message) {
  return (
    await inquirer.prompt({
      type: "file-tree-selection",
      name: "files",
      message: message,
      multiple: true
    })
  ).files;
}

async function text(message, defaultValue) {
  return (
    await inquirer.prompt({
      type: "input",
      name: "text",
      default: defaultValue,
      message: message,
    })
  ).text;
}
async function autocomplete(message, items) {
  return await choices(message, items, "autocomplete", null, 7);
}

async function list(message, items) {
  return await choices(message, items, "list", null, 15);
}

async function checkbox(message, items, defaults) {
  let list = [];
  do {
    list = await choices(message, items, "checkbox", defaults);
  } while (list.length === 0);
  return list;
}

async function prompt(message) {
  return (
    await inquirer.prompt({
      type: "confirm",
      name: "choice",
      default: "Yes",
      message: message,
    })
  ).choice;
}

module.exports = {
  autocomplete,
  list,
  checkbox,
  text,
  prompt,
  files,
  tree
};
