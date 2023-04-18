const program = require("commander");
const policies = require("./policies");
program
  .command("policies")
  .description("Genereates IAM policies for a state machine")
  .option("-t, --template-file [templateFile]", "Path to SAM template file", "template.yaml")
  .action(async (cmd) => {
    await policies.run(cmd);
  });
