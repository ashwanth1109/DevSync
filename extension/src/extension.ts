// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import * as util from "util";

const exec = util.promisify(cp.exec);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "devsync" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("devsync.run", async () => {
    //   const activeTerminal = vscode.window.activeTerminal;
    // activeTerminal.

    async function cpExec(cmd: string) {
      try {
        const { stdout, stderr } = await exec(cmd, {
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

    const currentCommitHash = await cpExec("git rev-parse HEAD");
    const gitStatus = await cpExec("git remote update && git status -uno");

    if (!/Your branch is behind/.test(gitStatus)) {
      // Do nothing
      return;
    }

    await cpExec("git pull");

    const latestCommitHash = await cpExec("git rev-parse HEAD");
    console.log("Compare", currentCommitHash, latestCommitHash);

    const diff = await cpExec(
      `git diff ${latestCommitHash} ${currentCommitHash} --name-only`
    );
    console.log("DIFF", diff);

    await cpExec("git status");

    const command = `git show -s --format='%ae' ${latestCommitHash}`;
    console.log(`"${command}"`);

    const authorEmail = await cpExec(command);
    console.log("AUTHOR EMAIL", authorEmail);

    const configuration = vscode.workspace.getConfiguration("devsync");
    console.log("CONFIGURATION", configuration);

    if (authorEmail !== configuration.email) {
      // commit by someone else
      return;
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
