// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { GitExtension } from "./types/git";

const { workspace } = vscode;

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
    const gitExtension = vscode.extensions.getExtension<GitExtension>(
      "vscode.git"
    )?.exports;
    const api = gitExtension?.getAPI(1);
    const repo = api?.repositories[0];

    const head1 = repo?.state.HEAD;
    console.log(JSON.stringify(vscode.workspace.rootPath));

    // cp.exec(`cd ${vscode.workspace.rootPath}/deploy && npm run test`,
    // (err: any, stdout: any) => {
    // 	console.log(stdout);
    // })

    const terminal = vscode.window.createTerminal({
      name: "My Command",
      cwd: `${vscode.workspace.rootPath}/deploy`,
    });

    terminal.show();

    terminal.sendText("npm run test");
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
