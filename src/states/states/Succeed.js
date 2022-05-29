async function build() {
  const snippet = {
    Type: "Succeed"
  };
  return JSON.parse(JSON.stringify(snippet));
}

module.exports = {
  build
}
