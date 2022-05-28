const inputUtil = require('../shared/inputUtil');
const fs = require('fs');
const path = require('path');

async function build() {
  const stateName = await inputUtil.text("Enter a name for the state", "MyNewState");
  const stateType = await inputUtil.autocomplete("Select a state type", [
    "Task",
    "Wait", 
    "Parallel", 
    "Pass", 
    "Fail", 
    "Succeed", 
    "Map"].sort().map(p => { return { name: p, value: p } }));

  if (fs.existsSync(path.join(__dirname, "states", `${stateType}.js`))) {
    const asl = await require(`./states/${stateType}`).build();
    return { stateName, asl }
  } else {
    console.log(`You are using a preview of sfn-cli where ${stateType} is not yet supported`)
  }
  return null;
}


module.exports = {
  build
}