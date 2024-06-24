export enum ShellName {
    cmd = 'cmd',
    pwsh = 'pwsh',
    powershell = 'powershell',
    bash = 'bash'
}
export class Shell {
    name: ShellName;
    env: any;
    fileExt: string;
    pathSeparator: string;
    constructor(shell: string, defaultShell: ShellName = ShellName.pwsh, env: any = {}) {
        shell = shell as keyof typeof ShellName;
        this.name = shell ? ShellName[shell] : defaultShell;
        this.env = env;

        switch (this.name) {
            case ShellName.cmd:
                this.fileExt = '.cmd';
                this.pathSeparator = '\\';
                break;
            case ShellName.pwsh:
            case ShellName.powershell:
                this.fileExt = '.ps1';
                this.pathSeparator = '\\';
                break;
            case ShellName.bash:
                this.fileExt = '.sh';
                this.pathSeparator = '/';
                if (env) {
                    var keys = Object.keys(env);
                    var keysSting = '';
                    keys.forEach(k => {
                        keysSting += k + '/u';
                    });
                    this.env['WSLENV'] = keysSting;
                }
                break;
        }
    }

    fixScript(str: string) {
        if (ShellName.cmd == this.name) {
            str = '@echo off\n' + str;
        }
        //console.log(str)
        return str;
    }
}
