import * as vscode from 'vscode'
import path = require('path');
import fs = require('fs');
import { parse, stringify } from 'comment-json';

export namespace launch_json {

/**
 * create executable task in launch.json
 * @param name project name
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param uri workspace folder uri
 */
export async function create_executable(name: string, relative_path: string, uri: vscode.Uri) : Promise<void> {
    const launch_json_uri = uri.with({
        path: path.join(uri.path, '.vscode', 'launch.json')
    });
    if (!fs.existsSync(launch_json_uri.path)) {
        vscode.window.showWarningMessage('launch.json not existed');
        return;
    }
    fs.readFile(launch_json_uri.path, 'utf8', (err, old_content) => {
        if (err) return;
        try {
            let data = parse(old_content);
            // launch
            data = _M_create_executable(name, relative_path, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(launch_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing launch.json content: ", e);
        }
    });
}
/**
 * create ctest task in launch.json
 * @param name project name
 * @param uri workspace folder uri
 */
export async function create_ctest(name: string, uri: vscode.Uri) : Promise<void> {
    const launch_json_uri = uri.with({
        path: path.join(uri.path, '.vscode', 'launch.json')
    });
    if (!fs.existsSync(launch_json_uri.path)) {
        vscode.window.showWarningMessage('launch.json not existed');
        return;
    }
    fs.readFile(launch_json_uri.path, 'utf8', (err, old_content) => {
        if (err) return;
        try {
            let data = parse(old_content);
            // launch
            data = _M_create_ctest(name, data)
            const new_content = stringify(data, null, 4);
            fs.writeFile(launch_json_uri.path, new_content, 'utf8', (err) => {
            });
        }
        catch (e) {
            console.error("Error in parsing launch.json content: ", e);
        }
    });
}





/**
 * create executable task in given json
 * @param name project name (prefix of task name)
 * @param relative_path relative path from root to (sub)project (empty or start with /)
 * @param data json object
 */
function _M_create_executable(name: string, relative_path: string, data: any) : any {
    const existing_task = data.configurations.find((configuration: any) => configuration.name === name);
    if (!existing_task) {
        const launch_task = {
            type: 'cppdbg',
            request: 'launch',
            name: name,
            program: '${workspaceFolder}' + relative_path + '/build/' + name,
            args: [],
            cwd: "${workspaceFolder}" + relative_path, // + "/build",
            miDebuggerPath: "gdb",
            setupCommands: [
                {
                    description: "Enable pretty-printing for gdb",
                    text: "-enable-pretty-printing",
                    ignoreFailures: true
                }
            ],
            preLaunchTask: name + '/make'
        }
        data.configurations.push(launch_task);
    }
    return data;
}
/**
 * create ctest task in given json
 * @param name project name (prefix of task name)
 * @param data json object
 */
function _M_create_ctest(name: string, data: any) : any {
    const existing_task = data.configurations.find((configuration: any) => configuration.name === 'test');
    if (!existing_task) {
        const test_launch_task = {
            type: 'node-terminal',
            request: 'launch',
            command: 'make test && exit',
            cwd: '${workspaceFolder}/build',
            name: 'test',
            preLaunchTask: name + '/make'
        }
        data.configurations.push(test_launch_task);
    }
    return data;
}

}