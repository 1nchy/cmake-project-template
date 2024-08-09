import * as vscode from 'vscode';
import * as init from './initialize';

export function activate(context: vscode.ExtensionContext) {
	// vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
	// 	if (vscode.workspace.workspaceFolders) {
			const cmake_project = vscode.commands.registerCommand('project-template.cmake-project', () => {
				vscode.window.showInformationMessage('CMake Project!');
				init.initialize_cmake_project();
			});
			const cmake_third_lib = vscode.commands.registerCommand('project-template.cmake-third-lib', () => {
				vscode.window.showInformationMessage('CMake Third Lib!');
				init.initialize_cmake_third_lib();
			});
			const cmake_third_lib_example = vscode.commands.registerCommand('project-template.cmake-third-lib-example', () => {
				vscode.window.showInformationMessage('CMake Third Lib Example!');
				init.initialize_cmake_third_lib_example();
			});

			context.subscriptions.push(cmake_project);
			context.subscriptions.push(cmake_third_lib);
			context.subscriptions.push(cmake_third_lib_example);
	// 	}
	// });
}

export function deactivate() {}