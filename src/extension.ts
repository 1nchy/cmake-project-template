import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const cmake_project = vscode.commands.registerCommand('cmake-template.cmake-project', () => {
		vscode.window.showInformationMessage('CMake Project!');
	});
	const cmake_third_lib = vscode.commands.registerCommand('cmake-template.cmake-third-lib', () => {
		vscode.window.showInformationMessage('CMake Third Lib!');
	});
	const cmake_third_lib_example = vscode.commands.registerCommand('cmake-template.cmake-third-lib-example', () => {
		vscode.window.showInformationMessage('CMake Third Lib Example!');
	});

	context.subscriptions.push(cmake_project);
	context.subscriptions.push(cmake_third_lib);
	context.subscriptions.push(cmake_third_lib_example);
}

export function deactivate() {}
