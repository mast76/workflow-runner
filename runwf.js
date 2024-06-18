const fs = require('fs')
const yaml = require('js-yaml')
var exec = require('child_process').execFileSync


// 
class Shell {
    name
    env
    constructor(shell, defaultShell = 'pwsh', env = new Map()) {
        this.env = env
        switch(shell?.toLowerCase())
        {
            case 'cmd':
                this.name ='cmd'
                break
            case 'pwsh':
                this.name='pwsh'
                break
            case 'powershell':
                this.name='powershell'
                break
            case 'bash':
                this.name='bash'
                break
            default:
                this.name=defaultShell
        }
        
        switch(this.name)
        {
            case 'bash': 
                if(env) {
                    var extEnv = 'WSLENV: '
                    var keys = Object.keys(env)
                    var keysSting = ''
                    keys.forEach(k => {
                        keysSting += k + '/u'
                    })
                    this.env.WSLENV=keysSting
                }
                break
        }
    }
}

function main() {
    try {
        let ymlFile = process.argv[2];
        if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
            const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8'))
            let globalShell = yamlData.defaults.run.shell
            globalShell = new Shell(globalShell)
            let globalWDir=yamlData.defaults['working-directory']
            let jobs = Object.keys(yamlData.jobs).map((key) => [key, yamlData.jobs[key]])

            jobs?.forEach(j => {
                console.log(j[0])
                let job = j[1]
                let jobShell=job.defaults.run.shell
                jobShell = new Shell(jobShell,globalShell.name)
                let jobWDir=job.defaults['working-directory'] ?? globalWDir
                if(job['runs-on']?.toLowerCase().startsWith('windows')) {
                    let i = 1;
                    job.steps.forEach(step => {
                        console.log(step.name)
                        let stepWDir=step['working-directory'] ?? jobWDir

                        if(step.run) {
                            let stepShell=new Shell(step.shell,jobShell.name, step.env)
                            exec(step.run,{env: stepShell.env, stdio: 'inherit', cwd: stepWDir, shell:stepShell.name})
                        }
                    })
                } 
                else
                {
                    console.log("Skipped job '"+ j[0] +"' cannot run on Windows!")
                }
            })
        }
        else
        {
            console.error('Usage: node runwf.ts <my-yaml.yml>')
        }

    } catch (error) {
        console.error(error)
    }
}

main()