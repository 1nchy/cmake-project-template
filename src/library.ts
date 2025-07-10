import * as vscode from 'vscode'
import * as path from 'path'

import * as utils from './utils'
import { tasks_json } from './tasks_json'
import { launch_json } from './launch_json'
import * as repository from './repository'

export namespace library {

export async function initialize() : Promise<void> {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const lib_name = workspace_folder.name;
        const relative_path = '';
        await tasks_json.create_task(lib_name, relative_path, workspace_folder.uri);
        await launch_json.create_ctest(lib_name, workspace_folder.uri);
        create_file(lib_name, workspace_folder.uri);
    }
}

async function create_file(name: string, uri: vscode.Uri) : Promise<void> {
    utils.mkdir(uri, ['doc']);
    utils.mkdir(uri, ['include']);
    utils.mkdir(uri, ['src']);
    utils.mkdir(uri, ['third']);
    utils.mkdir(uri, ['cmake']);
    utils.mkdir(uri, ['test']);
    await repository.fetch_from_reposity(uri, repository.constexpr.library_template, ['.gitignore']);
    await repository.fetch_from_reposity(uri, repository.constexpr.library_template, ['CMakeLists.txt']);
    await repository.fetch_from_reposity(uri, repository.constexpr.library_template, ['test', 'CMakeLists.txt']);
    await repository.fetch_from_reposity(uri, repository.constexpr.testing_framework, ['test', 'test.hpp']);
    await repository.fetch_from_reposity(uri, repository.constexpr.library_template, ['cmake', 'Findthird_lib.cmake']);
    await repository.fetch_from_reposity(uri, repository.constexpr.library_template, ['cmake', 'Findheader_only_third_lib.cmake']);
    utils.touch(uri, ['README.md']);
    utils.replace(repository.constexpr.library_expression, name, uri.with({
        path: path.join(uri.path, 'CMakeLists.txt')
    }));
}

}