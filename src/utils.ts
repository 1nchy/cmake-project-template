import path = require('path');
import * as vscode from 'vscode';
import fs = require('fs');

export async function get_user_input(default_input: string, prompt: string) {
    const input = await vscode.window.showInputBox({
        prompt: prompt
    });
    if (input && input.length > 0) {
        return input;
    }
    else {
        return default_input;
    }
}

/**
 * make directory
 * @param uri base folder
 * @param paths paths to be created
 */
export function mkdir(uri: vscode.Uri, paths: string[]) : void {
    try {
        const path_uri = uri.with({
            path: path.join(uri.path, ...paths)
        });
        if (!fs.existsSync(path_uri.fsPath)) {
            fs.mkdirSync(path_uri.fsPath, { recursive: true });
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`fail to mkdir : ${e}`);
    }
}

/**
 * create file
 * @param uri base folder
 * @param paths file paths to be created
 */
export function touch(uri: vscode.Uri, paths: string[]) : void {
    try {
        const file_uri = uri.with({
            path: path.join(uri.path, ...paths)
        });
        if (!fs.existsSync(file_uri.fsPath)) {
            fs.writeFileSync(file_uri.fsPath, '', 'utf8');
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`fail to touch : ${e}`);
    }
}

/**
 * replace words in specific file (regular expression)
 * @param src word to be replaced
 * @param dst word to replace
 * @param uri file uri
 */
export function replace(src: string, dst: string, uri: vscode.Uri) : void {
    const regex = new RegExp(src, 'g');
    try {
        const old_content = fs.readFileSync(uri.path, 'utf8');
        const new_content = old_content.replace(regex, dst);
        fs.writeFileSync(uri.path, new_content, 'utf8');
    }
    catch (e) {
        vscode.window.showWarningMessage(`fail to replace: ${e}`)
    }
}