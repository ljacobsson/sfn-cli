const program = require("commander");
const inspect = require("./inspect");
program
  .command("inspect")
  .alias("i")
  .description("Browses and inspects standard state machine exectutions")
  .option("-n, --name-prefix [prefix]", "Name prefix of state machine (optional)", "")
  .option("-s, --status-filter [statusFilter]", "Execution status filter. One of RUNNING | SUCCEEDED | FAILED | TIMED_OUT | ABORTED (optional)")
  .option("-p, --profile [profile]", "AWS profile to use", "default")
  .option("--region [region]", "The AWS region to use. Falls back on AWS_REGION environment variable if not specified")
  .action(async (cmd) => {
    await inspect.run(cmd);
  });
