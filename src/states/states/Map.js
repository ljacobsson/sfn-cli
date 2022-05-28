const inputUtil = require('../../shared/inputUtil');
const serviceLookup = require('../../shared/serviceLookup');

async function build() {

  const stateName = await inputUtil.text("Enter a name for the start state", "MyNewState");
  const response = await serviceLookup.getServiceAction();
  response.data.asl.End = true;
  const snippet = {
    Type: "Map",
    ItemsPath: "$.MyItemsArray",
    Iterator: {
      StartAt: stateName,
      States: {
        [stateName]: JSON.parse(JSON.stringify(response.data.asl).replace(":PARTITION:", ":aws:"))
      }
    },
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}

