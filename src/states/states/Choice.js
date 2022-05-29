
const { number } = require('yamlify-object-colors');
const inputUtil = require('../../shared/inputUtil');

const valueTypeOperators = [
  "IsBoolean",
  "IsNull",
  "IsNumeric",
  "IsPresent",
  "IsString",
  "IsTimestamp",
]

const logicalOperators = [
  "And",
  "Or",
  "Not"
]

const comparisonOperators = [
  "BooleanEquals",
  "BooleanEqualsPath",
  "NumericEquals",
  "NumericEqualsPath",
  "NumericGreaterThan",
  "NumericGreaterThanPath",
  "NumericGreaterThanEquals",
  "NumericGreaterThanEqualsPath",
  "NumericLessThan",
  "NumericLessThanPath",
  "NumericLessThanEquals",
  "NumericLessThanEqualsPath",
  "StringEquals",
  "StringEqualsPath",
  "StringGreaterThan",
  "StringGreaterThanPath",
  "StringGreaterThanEquals",
  "StringGreaterThanEqualsPath",
  "StringLessThan",
  "StringLessThanPath",
  "StringLessThanEquals",
  "StringLessThanEqualsPath",
  "StringMatches",
  "TimestampEquals",
  "TimestampEqualsPath",
  "TimestampGreaterThan",
  "TimestampGreaterThanPath",
  "TimestampGreaterThanEquals",
  "TimestampGreaterThanEqualsPath",
  "TimestampLessThan",
  "TimestampLessThanPath",
  "TimestampLessThanEquals",
  "TimestampLessThanEqualsPath"
]

async function build(parentState) {
  const snippet = {
    Type: "Choice",
    Choices: []
  };
  let path = "$.myVariable";
  while (true) {
    let choice;

    const variablePath = await inputUtil.text("Please enter a variable path", path);
    const comparison = await inputUtil.autocomplete("Select comparison operator", [...comparisonOperators, ...valueTypeOperators].sort().map(p => { return { name: p, value: p } }));
    if (comparisonOperators.includes(comparison)) {
      let value;
      if (comparison === "BooleanEquals") {
        value = await inputUtil.list("Please select a boolean value", ["true", "false"]);
        value = value === "true";
      } else if (comparison.includes("Timestamp") && !comparison.includes("Path")) {
        value = await inputUtil.datetime("Please select a timestamp", "value");
      }
      else if (comparison.includes("Numeric") && !comparison.includes("Path")) {
        value = await inputUtil.text("Please enter a numeric value", "value");
        value = parseFloat(value);
      }
      else {
        value = await inputUtil.text("Please enter a value", "value");
      }
      if (comparison.endsWith("Path")) {
        if (!value.startsWith("$.")) {
          value = `$.${value}`;
        }
      }
      choice = {
        Variable: variablePath,
        [comparison]: value
      };
    } else {
      choice = {
        Variable: variablePath,
        [comparison]: true
      };
    }
    const nextState = await inputUtil.autocomplete("Select or create next state", Object.keys(parentState).map(p => { return { name: p, value: p } }));
    choice.Next = nextState;

    snippet.Choices.push(choice);
    const addMore = await inputUtil.prompt("Do you want to add another choice?");
    if (!addMore) {
      break;
    }
  }
  const defaultState = await inputUtil.autocomplete("Select default state", Object.keys(parentState).map(p => { return { name: p, value: p } }));
  snippet.Default = defaultState;

  return snippet;
}

module.exports = {
  build
}
