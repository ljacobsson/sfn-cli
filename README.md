# sfn-cli

Command line interface for inspecting Amazon StepFunctions executions and building state machine definitions.

## Installation
`npm i -g @mhlabs/sfn-cli`

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

## Create / modify a state machine definition

Command: `$ sfn build --definition-file my-definition.yaml`

If the `my-definition.yaml` file doesn't exist, you will be prompted to create it. The tool will then create a skeleton of an ASL definition and guide you through creating the initial state.

![demo](./images/demo.gif)

## Browse and inspect state machines

Command: `$ sfn inspect`

```
Options:
  -n, --name-prefix [prefix]          Name prefix of state machine (optional) (default: "")
  -s, --status-filter [statusFilter]  Execution status filter. One of RUNNING | SUCCEEDED | FAILED | TIMED_OUT | ABORTED (optional)
  -p, --profile [profile]             AWS profile to use (default: "default")
  --region [region]                   The AWS region to use. Falls back on AWS_REGION environment variable if not specified
```

![demo](./images/demo-inspect.gif)

## Real time sync your local ASL with the cloud

Prerequisites is that the state machine is already deployed and that the local ASL definition matches the one that's deployed. This command supports SAM's `DefinitionSubstitution`s and a key/value map between substitution keys and actual values will be compiled at start-up.

Command: `$ sfn sync`

```
Usage: sfn sync|s [options]

Syncs a StepFunctions ASL file with the cloud

Options:
  -s, --stack-name [stackName]        The name of the deployed stack (required)
  -t, --template-file [templateFile]  Path to SAM template file (default: "template.yaml")
  -p, --profile [profile]             AWS profile to use (default: "default")
  --region [region]                   The AWS region to use. Falls back on AWS_REGION environment variable if not specified
  -h, --help                          display help for command
```

![demo](./images/demo-inspect.gif)

## Known issues
* Boolean logic in Choice states is not yet implemented
* By design, the tool will not guide you through adding ARNs and other parameters to SDK integrations. This is best done in a code editor.
