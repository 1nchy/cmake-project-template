import * as vscode from 'vscode';
import { project } from './project';
import { library } from './library';
import { example } from './example';

export function activate(context: vscode.ExtensionContext) {
	const cmake_project = vscode.commands.registerCommand('cmake-project-template.cmake-project', () => {
		vscode.window.showInformationMessage('CMake Project!');
		project.initialize();
	});
	const cmake_library = vscode.commands.registerCommand('cmake-project-template.cmake-library', () => {
		vscode.window.showInformationMessage('CMake Library!');
		library.initialize();
	});
	const cmake_example = vscode.commands.registerCommand('cmake-project-template.cmake-example', () => {
		vscode.window.showInformationMessage('CMake Library Example!');
		example.initialize();
	});

	context.subscriptions.push(cmake_project);
	context.subscriptions.push(cmake_library);
	context.subscriptions.push(cmake_example);
}

export function deactivate() {}