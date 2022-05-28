const program = require("commander");
const build = require("./build");
program
  .command("build")
  .alias("b")
  .description("Creates, explores and extends a StepFunctions ASL definition")
  .option("-d, --definition-file [definitionFile]", "Path to ASL definition file", "statemachine.yaml")
  .action(async (cmd) => {
    await build.run(cmd);
  });
