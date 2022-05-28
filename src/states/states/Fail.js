async function build() {
  const snippet = {
    Type: "Fail",
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
