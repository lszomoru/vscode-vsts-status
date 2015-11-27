// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {StatusService} from "./statusservice";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	var statusService: StatusService = new StatusService();

	// Register the commands from the extention
	vscode.commands.registerCommand("extension.openVSTSStatus", () => statusService.openServiceStatus());
}