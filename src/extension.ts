// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import * as util from "util";
import { log, error } from "console";
import { commands, window, workspace } from "vscode";

async function exec(cmd: string, channel: vscode.OutputChannel | null = null) {
  try {
    const { stdout, stderr } = await util.promisify(cp.exec)(cmd, {
      cwd: workspace.rootPath,
    });

    log("STDERR: ", stderr);
    log("STDOUT: ", stdout);

    if (channel) {
      channel.append(stdout);
    }

    return (stdout || "").trim();
  } catch (e) {
    error(e);

    return "";
  }
}

function sendMessageToTerminal(command: string) {
  const terminal = vscode.window.createTerminal({
    name: command,
    cwd: vscode.workspace.rootPath,
  });

  terminal.show();

  terminal.sendText(command);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let runningPrevious = false;
  let interval: NodeJS.Timeout | null = null;
  const channel = window.createOutputChannel("DevSync");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let startDisposable = commands.registerCommand("devsync.start", async () => {
    channel.show();

    const configuration = workspace.getConfiguration("devsync");
    // channel.appendLine("Using logic object:");
    // channel.append(JSON.stringify(configuration, null, 2));

    interval = setInterval(async () => {
      if (runningPrevious) {
        // if previous poll is still running, we can skip the poll for this interval
        return;
      }

      channel.appendLine("DevSync is polling to remote for changes");

      // Set to true once we start running to skip next ones to run parallely
      runningPrevious = true;

      // window.showInformationMessage("Polling for remote changes");

      const currentCommitHash = await exec("git rev-parse HEAD");

      // Hardcode while testing
      // const currentCommitHash = "7ddf2d8fd9bc70d0643f0f8469427363bbbf0998";

      const gitStatus = await exec("git remote update && git status -uno");

      // Hardcode while testing
      // const gitStatus = "Your branch is behind";

      // If your branch is already on the latest, then do nothing
      if (!/Your branch is behind/.test(gitStatus)) {
        runningPrevious = false;
        return;
      }

      await exec("git pull");
      const latestCommitHash = await exec("git rev-parse HEAD");

      channel.appendLine(
        `DevSync just pulled the latest changes from: ${latestCommitHash}`
      );

      // Hardcode while testing
      // const latestCommitHash = "5767e0a460de7a3c11e5e13bad55a7dcd9c56396";

      // // We want the author email so that only specific author's commits can trigger auto deploy
      const authorEmail = await exec(
        `git show -s --format='%ae' ${latestCommitHash}`
      );

      // // If not the same author as in the configuration don't do anything
      if (authorEmail !== `'${configuration.email}'`) {
        runningPrevious = false;
        return;
      }

      const diff = await exec(
        `git diff ${latestCommitHash} ${currentCommitHash} --name-only`
      );

      // TODO: Remove the map part because this is because our actual code is inside demo folder
      // So that we can house both the extension and our demo test directory in same repo
      const diffArr = diff.trim().split("\n");

      channel.appendLine(`Files changed: ${JSON.stringify(diffArr, null, 2)}`);

      // The commands to run in order
      const commandsToRun: any[] = [];

      const parseCommands = (entry: any) => {
        const commands = (entry[1] as unknown) as any[];
        commandsToRun.push(...commands);
      };

      Object.entries(configuration.logic).forEach((entry) => {
        // Simple file match
        if (!/\*/.test(entry[0])) {
          // No *, so it is a simple file
          const filePath = entry[0];

          // If one of the file path matches with diff array, parse and store commands
          if (diffArr.includes(filePath)) parseCommands(entry);
        } else if (entry[0].includes("**/*")) {
          // Match file in any sub folder with specific extension
          // ^frontend\/(?:.*).spec\.js$
          const pattern = new RegExp(
            `^${entry[0]
              .replace("/", "\\/")
              .replace(".", ".")
              .replace("**/*", "(?:.*)")}`
          );

          // If one of the file path matches with diff array, parse and store commands
          if (diffArr.some((file) => pattern.test(file))) parseCommands(entry);
        } else {
          // Match any file inside directory
          // ^deploy\/.*$
          const pattern = new RegExp(
            `^${entry[0].replace("/", "\\/").replace("*", ".*$")}`
          );

          // If one of the file path matches with diff array, parse and store commands
          if (diffArr.some((file) => pattern.test(file))) {
            parseCommands(entry);
          }
        }
      });

      log(commandsToRun);

      channel.append(
        `Commands to run: ${JSON.stringify(commandsToRun, null, 2)}`
      );

      const commandsThatHaveBeenRun: string[] = [];

      for (const command of commandsToRun) {
        if (
          typeof command === "string" &&
          !commandsThatHaveBeenRun.includes(command)
        ) {
          window.showInformationMessage(`Running command: ${command}`);
          await exec(command, channel);
          commandsThatHaveBeenRun.push(command);
        } else if (typeof command === "object") {
          /**
           * We will check for the special flag being passed
           * Currently, we have support for the following flags:
           * - manualOverride: Prompt user for confirmation before running
           * - skipIf: {testFor: [], commands: []}: Skip the next set of commands
           * - separateTab: Run command in separate tab (for example, if you previously ran start,
           *   you dont want to run test in the same tab since they both dont terminate on completion)
           */
          const key = Object.keys(command)[0];

          switch (key) {
            case "manualOverride":
              for (const subCommand of command.manualOverride) {
                const response = await window.showInformationMessage(
                  `Do you want to run '${subCommand}' ?`,
                  { modal: true },
                  "Yes",
                  "No"
                );

                if (response === "Yes") {
                  window.showInformationMessage(
                    `Running command: ${subCommand}`
                  );
                  await exec(subCommand, channel);
                  commandsThatHaveBeenRun.push(subCommand);
                }
              }
              break;
            case "skipIf":
              const { testFor, commands: skipCommands } = command.skipIf;

              // If one of the testFor commands have been run previously,
              // then we skip all commands in this step
              const testForCheck = testFor.some((subCommand: any) =>
                commandsThatHaveBeenRun.includes(subCommand)
              );

              if (testForCheck) {
                break;
              }

              for (const subCommand of skipCommands) {
                window.showInformationMessage(`Running command: ${subCommand}`);
                await exec(subCommand, channel);
                commandsThatHaveBeenRun.push(subCommand);
              }

              break;
            case "parallel":
              for (const subCommand of command.parallel || []) {
                sendMessageToTerminal(subCommand);
              }
              break;
            default:
              break;
          }
        }
      }

      runningPrevious = false;

      // TODO: Change this interval later
    }, configuration.interval * 1000);
  });

  let stopDisposable = commands.registerCommand("devsync.stop", async () => {
    if (interval) {
      channel.appendLine("DevSync has stopped polling for changes");
      clearInterval(interval);
    }
  });

  context.subscriptions.push(startDisposable, stopDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
