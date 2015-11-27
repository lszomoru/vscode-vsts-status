// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	var statusService: StatusService = new StatusService();

	// Register the commands from the extention
	vscode.commands.registerCommand("extension.openVSTSStatus", () => statusService.openServiceStatus());

	// Poll the service status every 5 minutes
	statusService.pollServiceStatus();
}

export class StatusService {
	private _statusBarItem: vscode.StatusBarItem;
	private _statusColors:Array<string> = ["GREEN", "YELLOW", "RED"];
	private _statusIcons:Array<string> = ["octicon-check", "octicon-alert", "octicon-alert"];
	private _defaultIcon:string = "octicon-question";
	private _defaultTooltip:string = "Visual Studio Team Services status.";
	private _statusPageUri:string = "https://www.visualstudio.com/support/support-overview-vs";

	constructor() {
		this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this.updateStatusBarItem(this._defaultIcon, this._defaultTooltip);

		// Override the service status page from the configuration file
		if (vscode.workspace.getConfiguration().get<string>("serviceStatusUri", "") != "") {
			this._statusPageUri = vscode.workspace.getConfiguration().get<string>("serviceStatusUri", "");
		}

		// Get the service status at the moment
		this.getServiceStatus();
	}

	public getServiceStatus() :void {
		var _self = this;
		var rest = require("rest");

		rest(this._statusPageUri).then(function(response) {
			if (response.status.code != 200) {
				_self.updateStatusBarItem(_self._defaultIcon, _self._defaultTooltip);
			} else {
				var icon = _self._defaultIcon;
				var tooltip = _self._defaultTooltip;

				// Extract the service status message from the HTML page
				var statusMessageResult = _self.execRegEx(response.entity, "<h1 xmlns=\"\">Visual Studio Team Services (\\w|\\W)*?</p>", "m");
				if (statusMessageResult != null && statusMessageResult.length > 0) {
					tooltip = statusMessageResult[0].substring(statusMessageResult[0].indexOf("<p") + 12, statusMessageResult[0].indexOf("</p"));
				}

				// Extract the service status from the HTML page
				for (var index = 0; index < _self._statusColors.length; index++) {
					var statusResult = _self.execRegEx(response.entity, "<img id=\""+ _self._statusColors[index] + "\"", "m");
					if (statusResult != null && statusResult.length > 0) {
						_self.updateStatusBarItem(_self._statusIcons[index], tooltip);
						break;
					}
				}
			}
		});
	}

	public openServiceStatus(): void {
		var open = require("open");
		open(this._statusPageUri);
	}

	public pollServiceStatus(): void {
		// Poll the service status every 5 minutes
		setInterval(() => this.getServiceStatus(), 1000 * 60 * 5);
	}

	private execRegEx(text:string, expr:string, flags:string):Array<string> {
		var regEx = new RegExp(expr, flags);
		return regEx.exec(text);
	}

	private updateStatusBarItem(icon:string, tooltip:string):void {
		this._statusBarItem.text = "VSTS $(icon "+ icon + ")";
		this._statusBarItem.tooltip = tooltip;
		this._statusBarItem.command = "extension.openVSTSStatus";
		this._statusBarItem.show();
	}

	dispose() {
		this._statusBarItem.dispose();
	}
}