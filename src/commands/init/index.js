const program = require("commander");
const init = require("./init");
program
  .command("init")
  .description("Initiates a SAM application with a single state machine resource")
  .option("-t, --template-file [templateFile]", "Path to SAM template file", "template.yaml")
  .option("-id, --logical-id [logicalId]", "Logical ID of state machine resource", "StateMachine")
  .option("-a, --asl-file [aslFile]", "Path to ASL definition file", "statemachine.yaml")
  .option("-e, --event-source [eventSource]", "Event source for state machine (none|eventbridge|api|schedule", "none")
  .action(async (cmd) => {
    await init.run(cmd);
  });
