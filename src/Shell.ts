import * as fs from 'fs';
import * as path from "path";
import { GitHubEnv } from "./GitHubEnv.js";
import { execFileSync } from 'child_process';
import { EnviromentHelper } from './EnviromentHelper.js';

export enum ShellName {
    cmd = 'cmd',
    pwsh = 'pwsh',
    powershell = 'powershell',
    bash = 'bash',
    python = 'py'
}

export class Shell {
    name: ShellName;
    env: GitHubEnv;
    shellExe: string;
    runFile: string;
    args: string[];
    wkDir: string;

    /**
     * GitHub uses bash from Git when run on Windows.
     * Default for child_process is to lookup bash in path, which seems to be the incompatible WSL bash.
     */
    static bashPath: string;
    static workflowTmpDir: string;

    constructor(shellName: string, parent: Shell, env: GitHubEnv = {} as GitHubEnv, wkDir: string, script?: string) {
        shellName = shellName as keyof typeof ShellName;
        this.name = shellName ? ShellName[shellName] : parent?.name ?? ShellName.powershell;
        
        if (parent?.env && env) {
            this.env = Object.assign(parent.env, env);
        } else if (parent?.env) {
            this.env = parent.env;
        } else {
            this.env = env;
        }
        
        this.wkDir = wkDir ?? parent.wkDir;

        let runScript = script ? EnviromentHelper.replaceExpression(script, this.env) : null;
        let tmpFile = script ? path.join(Shell.workflowTmpDir, (Math.random() + 1).toString(36).substring(2)) : null;
        let relPath = script ? path.relative(this.wkDir, tmpFile) : null;
        let fileExt = '';

        switch (this.name) {
            case ShellName.cmd:
                this.shellExe = this.name;
                fileExt = '.cmd'
                this.runFile = relPath + fileExt;
                runScript = '@echo off\n' + runScript;
                break;
            case ShellName.pwsh:
            case ShellName.powershell:
                this.shellExe = this.name;
                fileExt = '.ps1'
                this.runFile = relPath + fileExt;
                break;
            case ShellName.bash:
                this.shellExe = Shell.bashPath;
                fileExt = '.sh'
                this.runFile = relPath?.replaceAll('\\', '/') + fileExt;
                break;
            case ShellName.python:
                this.shellExe = ShellName.cmd;
                this.runFile = 'py';
                fileExt = '.py';
                this.args = [relPath + fileExt] 
                break;
        }

        if(tmpFile) {
            fs.writeFileSync(tmpFile + fileExt, runScript);
        }
    }
}
