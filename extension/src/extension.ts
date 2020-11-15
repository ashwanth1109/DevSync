// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import * as util from "util";

async function exec(cmd: string) {
  try {
    const { stdout, stderr } = await util.promisify(cp.exec)(cmd, {
      cwd: vscode.workspace.rootPath,
    });

    console.log("STDERR: ", stderr);
    console.log("STDOUT: ", stdout);

    return (stdout || "").trim();
  } catch (e) {
    console.error(e);

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
    const currentCommitHash = await exec("git rev-parse HEAD");
    const gitStatus = await exec("git remote update && git status -uno");

    // If your branch is already on the latest, then do nothing
    if (!/Your branch is behind/.test(gitStatus)) return;

    await exec("git pull");
    const latestCommitHash = await exec("git rev-parse HEAD");

    // We want the author email so that only specific author can trigger auto deploy
    const authorEmail = await exec(
      `git show -s --format='%ae' ${latestCommitHash}`
    );
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
