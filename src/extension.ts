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
    const gitExtension = vscode.extensions.getExtension<GitExtension>(
      "vscode.git"
    )?.exports;

	const api = gitExtension?.getAPI(1);
	
	const repo = api?.repositories[0]
	const head1 = repo?.state.HEAD

	console.log('HEAD 1', JSON.stringify(head1));

	const currentCommit = head1?.commit;
	console.log(currentCommit);

	await repo?.fetch(
		head1?.upstream?.remote, 
		head1?.upstream?.name
	);

	const head2 = repo?.state.HEAD

	console.log('HEAD 2', JSON.stringify(head2));

	console.log('HEAD behind check', head2?.behind);
	

	if (head2?.behind || 0 > 0) {
		// pull changes
		await repo?.pull();

		const head3 = repo?.state.HEAD

		console.log('HEAD 2', JSON.stringify(head3));

		const upstreamCommit = head3?.commit;

		if (!(currentCommit || upstreamCommit) || currentCommit === upstreamCommit) {
			return;
		}
		
		console.log('Looking for diff between commits', 
		currentCommit, upstreamCommit);

		const changes = await repo?.diffBetween(
			currentCommit as string, upstreamCommit as string);

		console.log('Diff comparison', changes);
		
	
		
	}

	const changes = repo?.diffWithHEAD();
	console.log(JSON.stringify(changes));
	
	

	

    
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
