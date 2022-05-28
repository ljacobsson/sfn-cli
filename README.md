# sfn-cli

Command line interface for building Amazon StepFunctions state machine definitions. Note that this is an early stage preview and some functionality will be missing.

## Usage
```
Usage: sfn [options] [command]

Options:
  -v, --vers         output the current version
  -h, --help         display help for command

Commands:
  build|b [options]  Creates, explores and extends a StepFunctions ASL definition
  help [command]     display help for command
```

## Creating / modifying a state machine definition

Command: `$ sfn build --definition-file my-definition.yaml`

If the `my-definition.yaml` file doesn't exist, you will be prompted to create it. The tool will then create a skeleton of an ASL definition and guide you through creating the initial state.

## Known issues
* Inserting Choice state not yet implemented.
* At the moment you can only insert leaf tasks. You can't insert tasks in between other tasks.
* By design, the tool will not guide you through adding ARNs and other parameters to SDK integrations. This is best done in a code editor.