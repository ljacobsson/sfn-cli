const services = require('../../../resources/services.json');
const inputUtil = require('../../shared/inputUtil');
const axios = require('axios');
async function build() {
  const snippet = {
    Type: "Pass",
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
