# DevSync

## The Problem

The adoption of a good tool that makes significant improvements to a developers workflow depends on how seamless the switch is.

As developers, we have strong opinions about languages, IDEs, terminals, themes, colors and all the bells and whistles that make us productive. DevSpaces approach to have VS code as the cloud IDE makes business sense, but can be a jarring experience for someone who has programs in different IDEs.

Furthermore, the native performance of a local IDE is probably going to be better, and more reliable. DevSpaces needs a way to get developers to adopt DevSpaces while still relying on their local IDEs to write code. Over time, developers would be increasing the time they spend on the cloud IDE.

This is where DevSync comes into the picture.

## DevSync - How it works?

![DevSync - How it works?](./assets/how-it-works.png)

## Feasibility Study:

1. Set an interval to trigger the run of a specific function at these intervals

Feasible, we can use setInterval like in the web

```
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
const gitExtension = vscode.extensions.getExtension<GitExtension>(
    "vscode.git"
  )?.exports;
const api = gitExtension?.getAPI(1);
const repo = api?.repositories[0]
const head1 = repo?.state.HEAD
const currentCommit = head1?.commit;

await repo?.fetch(
  head1?.upstream?.remote, 
  head1?.upstream?.name
);

const head2 = repo?.state.HEAD

if (head2?.behind || 0 > 0) {
  await repo?.pull();

  const head3 = repo?.state.HEAD
  const upstreamCommit = head3?.commit;

  if (!(currentCommit || upstreamCommit) || currentCommit === upstreamCommit) {
    return;
  }

  const changes = await repo?.diffBetween(
    currentCommit as string, upstreamCommit as string);
}
```

This shows the diff output as follows:

```json
[
  {
    status: 5,
    originalUri: {
      $mid: 1,
      path: "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      scheme: ""
    },
    uri: {
      $mid: 1,
      path: "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      scheme: ""
    },
    renameUri: {
      $mid: 1,
      path: "/c:/Users/ashwa/Desktop/Crossover/5k-voltdelta/README.md",
      scheme: "file"
    }
  }
]
```

## Developing in VS Code Notes:

```
"activationEvents": [
    "onStartupFinished"
]
```

[Expose config to be set in user settings](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)

[Packaging extension into VSIX](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#packaging-extensions)
