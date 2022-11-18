const yamlifyObject = require('yamlify-object');
const yamlifyColors = require('yamlify-object-colors');
const yamlCfn = require("yaml-cfn");
let format = {
  yaml: "yaml",
};
function parse(identifier, str) {
  try {
    const parsed = JSON.parse(str);
    format[identifier] = "json";
    return parsed;
  } catch {
    try {
      const parsed = yamlCfn.yamlParse(str);
      format[identifier] = "yaml";
      return parsed;
    } catch {
      return null;
    }
  }
}
function stringify(identifier, obj) {
  if (format[identifier] === "json") return JSON.stringify(obj, null, 2);
  if (format[identifier] === "yaml")
    return yamlCfn.yamlDump(obj).replace(/!<(.+?)>/g, "$1");
}

function renderPretty(identifier, obj) {
  if (format[identifier] === "json") return JSON.stringify(obj, null, 2);
  if (format[identifier] === "yaml")

    return formattedString = yamlifyObject(obj, {
      colors: yamlifyColors,
    }) + "\n";
}

module.exports = {
  parse,
  stringify,
  format,
  renderPretty
};
