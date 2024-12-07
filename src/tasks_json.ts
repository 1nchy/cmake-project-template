import * as vscode from 'vscode'
import path = require('path');
import fs = require('fs');
import { parse, stringify } from 'comment-json';

export namespace tasks_json {

/**
 * create lib/project compilation tasks in tasks.json
 * @param name project name
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param uri workspace folder uri
 */
export async function create_task(name: string, relative_path: string, uri: vscode.Uri) : Promise<void>;
/**
 * create lib/project compilation tasks in tasks.json
 * @param name project name
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param uri workspace folder uri
 * @param lib_name dependent lib name
 */
export async function create_task(name: string, relative_path: string, uri: vscode.Uri, lib_name: string) : Promise<void>;

export async function create_task(name: string, relative_path: string, uri: vscode.Uri, lib_name?: string) {
    const tasks_json_uri = uri.with({
        path: path.join(uri.path, '.vscode', 'tasks.json')
    });
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
            data = _M_create_mkdir(name, relative_path, data)
            // cmake ..
            if (lib_name == undefined) {
                data = _M_create_cmake(name, relative_path, data)
            }
            else {
                data = _M_create_cmake2(name, relative_path, data, lib_name);
            }
            // make
            data = _M_create_make(name, relative_path, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(tasks_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing tasks.json content: ", e);
        }
    });
}





/**
 * create mkdir task in given json
 * @param name project name (prefix of task name)
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param data json object
 */
function _M_create_mkdir(name: string, relative_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === name + '/mkdir');
    if (!existing_task) {
        const mkdir_task = {
            label: name + '/mkdir',
            type: "shell",
            command: "mkdir",
            options: {
                cwd: "${workspaceFolder}" + relative_path
            },
            args: [
                "-p", "build"
            ]
        }
        data.tasks.push(mkdir_task);
    }
    return data;
}
/**
 * create lib/project cmake task in given json
 * @param name project name (prefix of task name)
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param data json object
 */
function _M_create_cmake(name: string, relative_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === name + '/cmake');
    if (!existing_task) {
        const cmake_task = {
            label: name + '/cmake',
            type: "shell",
            command: "cmake",
            options: {
                cwd: "${workspaceFolder}" + relative_path + "/build"
            },
            args: [
                ".."
            ],
            dependsOn: [
                name + '/mkdir'
            ]
        }
        data.tasks.push(cmake_task);
    }
    return data;
}
/**
 * create example cmake task in given json
 * @param name project name (prefix of task name)
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param data json object
 * @param lib_name dependent lib name
 */
function _M_create_cmake2(name: string, relative_path: string, data: any, lib_name: string) {
    const existing_task = data.tasks.find((task: any) => task.label === name + '/cmake');
    if (!existing_task) {
        const cmake_task = {
            label: name + '/cmake',
            type: "shell",
            command: "cmake",
            options: {
                cwd: "${workspaceFolder}" + relative_path + "/build"
            },
            args: [
                ".."
            ],
            dependsOn: [
                lib_name + '/make',
                name + '/mkdir'
            ]
        }
        data.tasks.push(cmake_task);
    }
    return data;
}
/**
 * create make task in given json
 * @param name project name (prefix of task name)
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param data json object
 */
function _M_create_make(name: string,  relative_path: string, data: any) {
    const existing_task = data.tasks.find((task: any) => task.label === name + '/make');
    if (!existing_task) {
        const make_task = {
            label: name + '/make',
            type: "shell",
            command: "make",
            options: {
                cwd: "${workspaceFolder}" + relative_path + "/build"
            },
            args: [],
            dependsOn: [
                name + '/cmake'
            ]
        }
        data.tasks.push(make_task);
    }
    return data;
}

}