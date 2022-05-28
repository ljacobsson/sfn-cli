const services = require('../../../resources/services.json');
const inputUtil = require('../../shared/inputUtil');
const axios = require('axios');
async function build() {
  const snippet = {
    Type: "Wait",
    Seconds: 10,
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
