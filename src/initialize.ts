import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs')
import { parse, stringify } from 'comment-json';

export async function initialize_cmake_project() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = await get_project_name(workspace_basename);
        const project_path = '';
        await create_build_task(project_name, project_path, workspace_folder.uri);
        await create_launch_task(project_name, project_path, workspace_folder.uri);
        touch_project_file(project_name, workspace_folder.uri);
    }
}
export async function initialize_cmake_third_lib() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = await get_project_name(workspace_basename);
        const project_path = '';
        await create_build_task(project_name, project_path, workspace_folder.uri);
        touch_third_lib_file(project_name, workspace_folder.uri);
    }
}
export async function initialize_cmake_third_lib_example() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspace_folder = vscode.workspace.workspaceFolders[0];
        const workspace_basename = workspace_folder.name;
        const project_name = await get_project_name(workspace_basename);
        const project_path = '/example/' + project_name;
        await create_build_task(project_name, project_path, workspace_folder.uri);
        await create_launch_task(project_name, project_path, workspace_folder.uri);
        touch_example_file(project_name, workspace_folder.uri);
    }
}

async function get_project_name(default_name: string) {
    const project_name = await vscode.window.showInputBox({
        prompt: 'project name'
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
async function create_launch_task(project_name: string, project_path: string, workspace_uri: vscode.Uri) {
    const launch_json_uri = workspace_uri.with({
        path: path.join(workspace_uri.path, '.vscode', 'launch.json')
    });
    // try to touch launch.json
    if (!fs.existsSync(launch_json_uri.path)) {
        vscode.window.showWarningMessage('launch.json not existed');
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

function touch_project_file(project_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['doc']);
    _M_mkdir(workspace_uri, ['include']);
    _M_mkdir(workspace_uri, ['src']);
    _M_mkdir(workspace_uri, ['third']);
    _M_mkdir(workspace_uri, ['cmake']);
    _M_touch(workspace_uri, ['.gitignore']);
    _M_touch(workspace_uri, ['CMakeLists.txt']);
    _M_touch(workspace_uri, ['src', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['third', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['README.md']);
    _M_touch(workspace_uri, ['main.cpp']);
}
function touch_example_file(project_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['example', project_name]);
    _M_mkdir(workspace_uri, ['example', project_name, 'include']);
    _M_mkdir(workspace_uri, ['example', project_name, 'src']);
    _M_mkdir(workspace_uri, ['doc', project_name]);
    _M_touch(workspace_uri, ['example', project_name, '.gitignore']);
    _M_touch(workspace_uri, ['example', project_name, 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['example', project_name, 'src', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['example', project_name, 'main.cpp']);
    _M_touch(workspace_uri, ['doc', project_name, 'usage.md']);
}
function touch_third_lib_file(project_name: string, workspace_uri: vscode.Uri) {
    _M_mkdir(workspace_uri, ['doc']);
    _M_mkdir(workspace_uri, ['include']);
    _M_mkdir(workspace_uri, ['src']);
    _M_mkdir(workspace_uri, ['third']);
    _M_mkdir(workspace_uri, ['cmake']);
    _M_touch(workspace_uri, ['.gitignore']);
    _M_touch(workspace_uri, ['CMakeLists.txt']);
    _M_touch(workspace_uri, ['src', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['third', 'CMakeLists.txt']);
    _M_touch(workspace_uri, ['README.md']);
    _M_touch(workspace_uri, ['main.cpp']);
}

function _M_mkdir(workspace_uri: vscode.Uri, paths: string[]) {
    try {
        const _uri = workspace_uri.with({
            path: path.join(workspace_uri.path, ...paths)
        });
        if (!fs.existsSync(_uri.fsPath)) {
            fs.mkdirSync(_uri.fsPath, { recursive: true });
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Fail to create folder : ${e}`);
    }
}
function _M_touch(workspace_uri: vscode.Uri, paths: string[]) {
    try {
        const _uri = workspace_uri.with({
            path: path.join(workspace_uri.path, ...paths)
        });
        if (!fs.existsSync(_uri.fsPath)) {
            fs.writeFileSync(_uri.fsPath, '');
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Fail to create file : ${e}`);
    }
}