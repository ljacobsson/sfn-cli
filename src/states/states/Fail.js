async function build() {
  const snippet = {
    Type: "Fail"
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
