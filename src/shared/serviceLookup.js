const axios = require('axios');
const inputUtil = require('./inputUtil');
const services = require('../../resources/services.json');

async function getServiceAction() {
  const serviceNames = services.services.map(p => { return { name: p.label, value: p }; }).sort((a, b) => { return a.label > b.label ? -1 : 1; });
  const service = await inputUtil.autocomplete("Select service", serviceNames);
  const action = await inputUtil.autocomplete(`Select ${service.label} action`, service.actions.map(p => { return { name: p.actionName, value: p.actionName }; }).sort((a, b) => { return a.actionName > b.actionName ? -1 : 1; }));
  const url = `https://eu-west-1.console.aws.amazon.com/states/usi/v1/apis/${service.serviceId}-${action.charAt(0).toLowerCase() + action.slice(1)}.json`;
  const response = await axios.get(url);
  console.log(`Adding SDK integration for ${service.label} ${action}.\nDocs: https://docs.aws.amazon.com${response.data.docUrl}\n`);
  return response;
}

module.exports = {
  getServiceAction
}