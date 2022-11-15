const inputUtil = require('../../shared/inputUtil');
const serviceLookup = require('../../shared/serviceLookup');
const stateBuilder = require('../stateBuilder');
async function build() {
  const state = await stateBuilder.build()

  //  const stateName = await inputUtil.text("Enter a name for the start state", "MyNewState");
  //  const response = await serviceLookup.getServiceAction();End
  state.asl.End = true;
  const snippet = {
    Type: "Map",
    ItemsPath: "$.MyItemsArray",
    Iterator: {
      StartAt: state.stateName,
      States: {
        [state.stateName]: JSON.parse(JSON.stringify(state.asl).replace(":PARTITION:", ":aws:"))
      }
    },
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}

