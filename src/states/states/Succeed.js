async function build() {
  const snippet = {
    Type: "Succeed",
    End: true
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
