import * as vscode from 'vscode'
import * as path from 'path'

import * as utils from './utils'
import { tasks_json } from './tasks_json'
import { launch_json } from './launch_json'
import * as repository from './repository'

export namespace example {

export async function initialize() : Promise<void> {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const lib_name = workspace_folder.name;
        const example_name = await utils.get_user_input('', 'example name');
        if (example_name.length === 0) {
            vscode.window.showInformationMessage('Example name can\'t be empty');
            return;
        }
        const relative_path = '/example/' + example_name;
        await tasks_json.create_task(example_name, relative_path, workspace_folder.uri, lib_name);
        await launch_json.create_executable(example_name, relative_path, workspace_folder.uri);
        create_file(example_name, lib_name, workspace_folder.uri);
    }
}

async function create_file(name: string, lib_name: string, uri: vscode.Uri) : Promise<void> {
    utils.mkdir(uri, ['example', name]);
    uri = uri.with({
        path: path.join(uri.path, 'example', name)
    });
    utils.mkdir(uri, ['include']);
    utils.mkdir(uri, ['src']);
    utils.mkdir(uri, ['cmake']);
    await repository.fetch_from_reposity(uri, repository.constexpr.example_template, ['.gitignore']);
    await repository.fetch_from_reposity(uri, repository.constexpr.example_template, ['CMakeLists.txt']);
    await repository.fetch_from_reposity(uri, repository.constexpr.example_template, ['cmake', 'Findthird_lib.cmake']);
    await repository.fetch_from_reposity(uri, repository.constexpr.example_template, ['cmake', 'Findheader_only_third_lib.cmake']);
    utils.touch(uri, ['main.cpp']);
    utils.replace(repository.constexpr.project_expression, name, uri.with({
        path: path.join(uri.path, 'CMakeLists.txt')
    }));
    utils.replace(repository.constexpr.library_expression, lib_name, uri.with({
        path: path.join(uri.path, 'CMakeLists.txt')
    }));
}

}