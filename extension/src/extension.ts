// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import * as util from "util";
import { log, error } from "console";

async function exec(cmd: string) {
  try {
    const { stdout, stderr } = await util.promisify(cp.exec)(cmd, {
      cwd: vscode.workspace.rootPath,
    });

    log("STDERR: ", stderr);
    log("STDOUT: ", stdout);

    return (stdout || "").trim();
  } catch (e) {
    error(e);

    return "";
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("devsync.run", async () => {
    const configuration = vscode.workspace.getConfiguration("devsync");
    log("CONFIGURATION", configuration);

    // setInterval(async () => {
    vscode.window.showInformationMessage("Running in interval");

    // const currentCommitHash = await exec("git rev-parse HEAD");

    // Hardcode while testing
    const currentCommitHash = "183bf15028d3356a9edb530a98b1764f4a380cb3";

    // const gitStatus = await exec("git remote update && git status -uno");

    // Hardcode while testing
    const gitStatus = "Your branch is behind";

    // If your branch is already on the latest, then do nothing
    if (!/Your branch is behind/.test(gitStatus)) return;

    // await exec("git pull");
    // const latestCommitHash = await exec("git rev-parse HEAD");

    // Hardcode while testing
    const latestCommitHash = "6aacce3a5a44411cd7f96953f3907f66e8f5bb8f";

    // // We want the author email so that only specific author's commits can trigger auto deploy
    // const authorEmail = await exec(
    //   `git show -s --format='%ae' ${latestCommitHash}`
    // );

    // // If not the same author as in the configuration don't do anything
    // if (configuration.email !== authorEmail) return;

    const diff = await exec(
      `git diff ${latestCommitHash} ${currentCommitHash} --name-only`
    );

    // TODO: Remove the map part because this is because our actual code is inside demo folder
    // So that we can house both the extension and our demo test directory in same repo
    const diffArr = diff
      .trim()
      .split("\n")
      .map((i) => i.replace("demo/", ""));

    // The commands to run in order
    const commandsToRun: string[] = [];

    Object.entries(configuration.logic).forEach((entry) => {
      // Simple file match
      if (!/\*/.test(entry[0])) {
        // No *, so it is a simple file
        const filePath = entry[0];

        if (diffArr.includes(filePath)) {
          const commands = (entry[1] as unknown) as any[];

          for (const command of commands) {
            if (
              typeof command === "string" &&
              !commandsToRun.includes(command)
            ) {
              commandsToRun.push(command);
            }
          }
        }
      }
    });

    log(commandsToRun);

    // TODO: Change this interval later
    // }, configuration.interval * 100);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
