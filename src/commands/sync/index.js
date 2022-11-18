const program = require("commander");
const sync = require("./sync");
program
  .command("sync")
  .alias("s")
  .description("Syncs a StepFunctions ASL file with the cloud")
  .option("-t, --template-file [templateFile]", "Path to SAM template file", "template.yaml")
  .option("-s, --stack-name [stackName]", "The name of the deployed stack")
  .option("-p, --profile [profile]", "AWS profile to use", "default")
  .option("--region [region]", "The AWS region to use. Falls back on AWS_REGION environment variable if not specified")
  .action(async (cmd) => {
    if (!cmd.stackName) {
      console.error("Missing required option: --stack-name");
      process.exit(1);
    }
    await sync.run(cmd);
  });
