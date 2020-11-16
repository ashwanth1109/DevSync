# Feasibility Study:

1. Set an interval to trigger the run of a specific function at these intervals

Feasible, we can use setInterval like in the web

```ts
// TODO: Set Interval example
let count = 0;
setInterval(() => {
  // Display a message box to the user
  vscode.window.showInformationMessage(`Trigger count: ${count++}`);
}, 2000);
```

2. Get diff between currentCommit and latest upstreamCommit

Feasible, by extending the vscode git API

```ts
const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git")
  ?.exports;
const api = gitExtension?.getAPI(1);
const repo = api?.repositories[0];
const head1 = repo?.state.HEAD;
const currentCommit = head1?.commit;

await repo?.fetch(head1?.upstream?.remote, head1?.upstream?.name);

const head2 = repo?.state.HEAD;

if (head2?.behind || 0 > 0) {
  await repo?.pull();

  const head3 = repo?.state.HEAD;
  const upstreamCommit = head3?.commit;

  if (!(currentCommit || upstreamCommit) || currentCommit === upstreamCommit) {
    return;
  }

  const changes = await repo?.diffBetween(
    currentCommit as string,
    upstreamCommit as string
  );
}
```

This shows the diff output as follows:

```json
[
  {
    "status": 5,
    "originalUri": {
      "$mid": 1,
      "path": "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      "scheme": ""
    },
    "uri": {
      "$mid": 1,
      "path": "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      "scheme": ""
    },
    "renameUri": {
      "$mid": 1,
      "path": "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      "scheme": "file"
    }
  }
]
```

3. Create terminal from extension

```ts
const terminal = vscode.window.createTerminal({
  name: "My Command",
  cwd: `${vscode.workspace.rootPath}/deploy`,
});

terminal.show();

terminal.sendText("npm run test");
```

4. Major blocker: vscode git API is not working on DevSpaces

So, revamping our approach with that of creating child process that runs git commands and piping that output to an output channel
