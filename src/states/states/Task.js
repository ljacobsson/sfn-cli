const serviceLookup = require('../../shared/serviceLookup');
async function build() {
  const response = await serviceLookup.getServiceAction();
  return JSON.parse(JSON.stringify(response.data.asl).replace(":PARTITION:", ":aws:"));
}

module.exports = {
  build
}
