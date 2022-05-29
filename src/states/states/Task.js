const serviceLookup = require('../../shared/serviceLookup');
async function build() {
  const response = await serviceLookup.getServiceAction();
  response.data.asl.End = true;
  return JSON.parse(JSON.stringify(response.data.asl).replace(":PARTITION:", ":aws:"));
}

module.exports = {
  build
}
