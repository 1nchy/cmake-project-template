import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');
import axios from 'axios';

export namespace constexpr {

export const library_expression = '<third_lib_name>';
export const project_expression = '<project_name>';
export const owner = '1nchy';
export const branch = 'master';
export const project_template = 'project_template';
export const example_template = 'example_template';
export const library_template = 'third_lib_template';

}

export async function fetch_from_reposity(uri: vscode.Uri, name: string, paths: string[]) : Promise<void> {
    try {
        const file_uri = uri.with({
            path: path.join(uri.path, ...paths)
        });
        if (!fs.existsSync(file_uri.fsPath)) {
            const url = get_repository_url(constexpr.owner, name, constexpr.branch, paths.join('/'));
            await fetch_from_url(file_uri, url)
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`fail to fetch_from_reposity: ${e}`);
    }
}

async function fetch_from_url(uri: vscode.Uri, url: string) : Promise<void> {
    try {
        const url_content = (await axios.get(url)).data;
        fs.writeFileSync(uri.path, url_content, 'utf8');
    }
    catch (e) {
        vscode.window.showWarningMessage(`fail to fetch_from_url: ${e}`);
        fs.writeFileSync(uri.path, '', 'utf8');
    }
}

function get_repository_url(owner: string, repo: string, branch: string, file: string) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
}