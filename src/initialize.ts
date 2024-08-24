import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');
import { parse, stringify } from 'comment-json';
const axios = require('axios');

export async function initialize_cmake_project() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = workspace_basename;
        const project_path = '';
        await create_build_task(project_name, project_path, workspace_folder.uri);
        await create_launch_task(project_name, project_path, workspace_folder.uri);
        create_project_file(project_name, workspace_folder.uri);
    }
}
export async function initialize_cmake_third_lib() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = workspace_basename;
        const project_path = '';
        await create_build_task(project_name, project_path, workspace_folder.uri);
        create_third_lib_file(project_name, workspace_folder.uri);
    }
}
export async function initialize_cmake_third_lib_example() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = await get_project_name('', 'example name');
        if (project_name.length === 0) {
            vscode.window.showInformationMessage('Example name can\'t be empty');
            return;
        }
        const project_path = '/example/' + project_name;
        await create_example_build_task(project_name, project_path, workspace_basename, workspace_folder.uri);
        await create_launch_task(project_name, project_path, workspace_folder.uri);
        create_example_file(project_name, workspace_basename, workspace_folder.uri);
    }
}

async function get_project_name(default_name: string, prompt: string) {
    const project_name = await vscode.window.showInputBox({
        prompt: prompt
    });
    if (project_name && project_name.length > 0) {
        return project_name;
    }
    else {
        return default_name;
    }
}


async function create_build_task(project_name: string, project_path: string, workspace_uri: vscode.Uri) {
    const tasks_json_uri = workspace_uri.with({
        path: path.join(workspace_uri.path, '.vscode', 'tasks.json')
    });
    // try to touch tasks.json
    if (!fs.existsSync(tasks_json_uri.path)) {
        vscode.window.showWarningMessage('tasks.json not existed');
        await vscode.commands.executeCommand('workbench.action.tasks.configureDefaultBuildTask');
        return;
    }
    fs.readFile(tasks_json_uri.path, 'utf8', (err, old_content) => {
        if (err) return;
        try {
            let data = parse(old_content);
            // mkdir -p build
            data = _M_create_mkdir_task(project_name, project_path, data)
            // cmake ..
            data = _M_create_cmake_task(project_name, project_path, data)
            // make
            data = _M_create_make_task(project_name, project_path, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(tasks_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing tasks.json content: ", e);
        }
    });
}
async function create_example_build_task(project_name: string, project_path: string, lib_name: string, workspace_uri: vscode.Uri) {
    const tasks_json_uri = workspace_uri.with({
        path: path.join(workspace_uri.path, '.vscode', 'tasks.json')
    });
    // try to touch tasks.json
    if (!fs.existsSync(tasks_json_uri.path)) {
        vscode.window.showWarningMessage('tasks.json not existed');
        await vscode.commands.executeCommand('workbench.action.tasks.configureDefaultBuildTask');
        return;
    }
    fs.readFile(tasks_json_uri.path, 'utf8', (err, old_content) => {
        if (err) return;
        try {
            let data = parse(old_content);
            // mkdir -p build
            data = _M_create_mkdir_task(project_name, project_path, data)
            // cmake ..
            data = _M_create_example_cmake_task(project_name, project_path, lib_name, data)
            // make
            data = _M_create_make_task(project_name, project_path, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(tasks_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing tasks.json content: ", e);
        }
    });
}
async function create_launch_task(project_name: string, project_path: string, workspace_uri: vscode.Uri) {
    const launch_json_uri = workspace_uri.with({
        path: path.join(workspace_uri.path, '.vscode', 'launch.json')
    });
    // try to touch launch.json
    if (!fs.existsSync(launch_json_uri.path)) {
        vscode.window.showWarningMessage('launch.json not existed');
        return;
    }
    fs.readFile(launch_json_uri.path, 'utf8', (err, old_content) => {
        if (err) return;
        try {
            let data = parse(old_content);
            // launch
            data = _M_create_launch_task(project_name, project_path, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(launch_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing launch.json content: ", e);
        }
    });
}

function _M_create_mkdir_task(project_name: string, project_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === project_name + '/mkdir');
    if (!existing_task) {
        const mkdir_task = {
            label: project_name + '/mkdir',
            type: "shell",
            command: "mkdir",
            options: {
                cwd: "${workspaceFolder}" + project_path
            },
            args: [
                "-p", "build"
            ]
        }
        data.tasks.push(mkdir_task);
    }
    return data;
}
function _M_create_cmake_task(project_name: string, project_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === project_name + '/cmake');
    if (!existing_task) {
        const cmake_task = {
            label: project_name + '/cmake',
            type: "shell",
            command: "cmake",
            options: {
                cwd: "${workspaceFolder}" + project_path + "/build"
            },
            args: [
                ".."
            ],
            dependsOn: [
                project_name + '/mkdir'
            ]
        }
        data.tasks.push(cmake_task);
    }
    return data;
}
function _M_create_example_cmake_task(project_name: string, project_path: string, lib_name: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === project_name + '/cmake');
    if (!existing_task) {
        const cmake_task = {
            label: project_name + '/cmake',
            type: "shell",
            command: "cmake",
            options: {
                cwd: "${workspaceFolder}" + project_path + "/build"
            },
            args: [
                ".."
            ],
            dependsOn: [
                lib_name + '/make',
                project_name + '/mkdir'
            ]
        }
        data.tasks.push(cmake_task);
    }
    return data;
}
function _M_create_make_task(project_name: string, project_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === project_name + '/make');
    if (!existing_task) {
        const make_task = {
            label: project_name + '/make',
            type: "shell",
            command: "make",
            options: {
                cwd: "${workspaceFolder}" + project_path + "/build"
            },
            args: [],
            dependsOn: [
                project_name + '/cmake'
            ]
        }
        data.tasks.push(make_task);
    }
    return data;
}
function _M_create_launch_task(project_name: string, project_path: string, data: any) {
    const existing_task = data.configurations.find((configuration: any) => configuration.name === project_name);
    if (!existing_task) {
        const launch_task = {
            type: 'cppdbg',
            request: 'launch',
            name: project_name,
            program: '${workspaceFolder}' + project_path + '/build/' + project_name,
            args: [],
            cwd: "${workspaceFolder}" + project_path, // + "/build",
            preLaunchTask: project_name + '/make'
        }
        data.configurations.push(launch_task);
    }
    return data;
}

async function create_project_file(project_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['doc']);
    _M_mkdir(workspace_uri, ['include']);
    _M_mkdir(workspace_uri, ['src']);
    _M_mkdir(workspace_uri, ['third']);
    _M_mkdir(workspace_uri, ['cmake']);
    _M_mkdir(workspace_uri, ['lib']);
    await _M_touch_from_repo(workspace_uri, 'project_template', ['.gitignore']);
    await _M_touch_from_repo(workspace_uri, 'project_template', ['CMakeLists.txt']);
    await _M_touch_from_repo(workspace_uri, 'project_template', ['cmake', 'Findthird_lib.cmake']);
    await _M_touch_from_repo(workspace_uri, 'project_template', ['cmake', 'Findheader_only_third_lib.cmake']);
    _M_touch(workspace_uri, ['README.md']);
    _M_touch(workspace_uri, ['main.cpp']);

    _M_substitute_project_name(project_name, workspace_uri.with({
        path: path.join(workspace_uri.path, 'CMakeLists.txt')
    }));
}
async function create_example_file(project_name: string, third_lib_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['example', project_name]);
    workspace_uri = workspace_uri.with({
        path: path.join(workspace_uri.path, 'example', project_name)
    });
    _M_mkdir(workspace_uri, ['include']);
    _M_mkdir(workspace_uri, ['src']);
    _M_mkdir(workspace_uri, ['cmake']);
    await _M_touch_from_repo(workspace_uri, 'example_template', ['.gitignore']);
    await _M_touch_from_repo(workspace_uri, 'example_template', ['CMakeLists.txt']);
    await _M_touch_from_repo(workspace_uri, 'example_template', ['src', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['main.cpp']);

    _M_substitute_project_name(project_name, workspace_uri.with({
        path: path.join(workspace_uri.path, 'CMakeLists.txt')
    }));
    _M_substitute_third_lib_name(third_lib_name, workspace_uri.with({
        path: path.join(workspace_uri.path, 'CMakeLists.txt')
    }));
}
async function create_third_lib_file(project_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['doc']);
    _M_mkdir(workspace_uri, ['include']);
    _M_mkdir(workspace_uri, ['src']);
    _M_mkdir(workspace_uri, ['third']);
    _M_mkdir(workspace_uri, ['cmake']);
    await _M_touch_from_repo(workspace_uri, 'third_lib_template', ['.gitignore']);
    await _M_touch_from_repo(workspace_uri, 'third_lib_template', ['CMakeLists.txt']);
    _M_touch(workspace_uri, ['third', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['README.md']);

    _M_substitute_third_lib_name(project_name, workspace_uri.with({
        path: path.join(workspace_uri.path, 'CMakeLists.txt')
    }));
}

function _M_mkdir(workspace_uri: vscode.Uri, paths: string[]) {
    try {
        const file_uri = workspace_uri.with({
            path: path.join(workspace_uri.path, ...paths)
        });
        if (!fs.existsSync(file_uri.fsPath)) {
            fs.mkdirSync(file_uri.fsPath, { recursive: true });
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Fail to create folder : ${e}`);
    }
}
function _M_touch(workspace_uri: vscode.Uri, paths: string[]) {
    try {
        const file_uri = workspace_uri.with({
            path: path.join(workspace_uri.path, ...paths)
        });
        if (!fs.existsSync(file_uri.fsPath)) {
            fs.writeFileSync(file_uri.fsPath, '', 'utf8');
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Fail to create file : ${e}`);
    }
}
async function _M_touch_from_repo(workspace_uri: vscode.Uri, repo: string, paths: string[]) {
    try {
        const file_uri = workspace_uri.with({
            path: path.join(workspace_uri.path, ...paths)
        });
        if (!fs.existsSync(file_uri.fsPath)) {
            await _M_write_file_from_git_repository(file_uri, repo, paths.join('/'));
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Fail to create file: ${e}`);
    }
}
function _M_get_git_repository_url(owner: string, repo: string, branch: string, file: string) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
}
async function _M_get_url_content(url: string) {
    const response = await axios.get(url);
    return response.data;
}
async function _M_write_file_from_git_repository(file_uri: vscode.Uri, repo: string, file: string) {
    try {
        const owner = '1nchy'
        const branch = 'master'
        const url = _M_get_git_repository_url(owner, repo, branch, file);
        const url_content = await _M_get_url_content(url);
        fs.writeFileSync(file_uri.path, url_content, 'utf8');
    }
    catch (e) {
        vscode.window.showWarningMessage(`Fail to fetch content: ${e}`);
        fs.writeFileSync(file_uri.path, '', 'utf8');
    }
}
function _M_substitute_project_name(project_name: string, file_uri: vscode.Uri) {
    const regex = new RegExp('<project_name>', 'g');
    try {
        const old_content = fs.readFileSync(file_uri.path, 'utf8');
        const new_content = old_content.replace(regex, project_name);
        fs.writeFileSync(file_uri.path, new_content, 'utf8');
    }
    catch (e) {
        vscode.window.showWarningMessage(`Fail to substitute: ${e}`)
    }
}
function _M_substitute_third_lib_name(third_lib_name: string, file_uri: vscode.Uri) {
    const regex = new RegExp('<third_lib_name>', 'g');
    try {
        const old_content = fs.readFileSync(file_uri.path, 'utf8');
        const new_content = old_content.replace(regex, third_lib_name);
        fs.writeFileSync(file_uri.path, new_content, 'utf8');
    }
    catch (e) {
        vscode.window.showWarningMessage(`Fail to substitute: ${e}`)
    }
}