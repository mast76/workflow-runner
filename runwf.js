const fs = require('fs')
const path = require('path'); 
const yaml = require('js-yaml');
const { env } = require('process');
var exec = require('child_process').execFileSync


class Shell {
    name
    env
    fileExt
    pathSeparator
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
            case 'cmd':
                this.fileExt ='.cmd'
                this.pathSeparator='\\'
                break
            case 'pwsh':
            case 'powershell':
                this.fileExt='.ps1'
                this.pathSeparator='\\'
                break
            case 'bash': 
                this.fileExt='.sh'
                this.pathSeparator='/'
                if(env) {
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

    fixScript(str) {
        if('cmd'==this.name){
            str = '@echo off\n' + str
        }
        //console.log(str)
        return str
    }
}

function injectSystemEnv(str, localEnv) {
    let m = /\${{\s*(\S*)\s*}}/gs
    let r = /.*\${{\s*(\S*)\s*}}.*/gs
    let s 
    str?.match(m)?.forEach(s => {
        let key = str.replace(r,'$1')
        var val=''
        if(key?.startsWith('env.')) {
            key = key.substring(4)
            val = localEnv?localEnv[key]:undefined
        }
        if(val){
            str = str.replace(s,val)
        }
    })
  //  console.log(str)
    return str
}

//injectSystemEnv('echo %msg%\necho Line two ${{ USERNAME }}')


function main() {
    try {
        let ymlFile = process.argv[2];
        if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
            const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8'))
            let globalShell = yamlData.defaults?.run?.shell
            globalShell = new Shell(globalShell)
            let globalWDir=yamlData.defaults['working-directory']
            let globalEnv=yamlData.env
            let jobs = Object.keys(yamlData.jobs).map((key) => [key, yamlData.jobs[key]])

            jobs?.forEach(j => {
                console.log(j[0])
                let job = j[1]
                let jobShell=job.defaults?.run?.shell
                jobShell = new Shell(jobShell,globalShell.name)
                let jobWDir=job.defaults['working-directory'] ?? globalWDir
                let jobEnv=job.env
                if(jobEnv && globalEnv) {
                    jobEnv = Object.assign(globalEnv,jobEnv)
                } else if (globalEnv) {
                    jobEnv = globalEnv
                }
                if(job['runs-on']?.toLowerCase().startsWith('windows')) {
                    job.steps?.forEach(step => {
                        console.log(step.name)
                        let stepWDir=step['working-directory'] ?? jobWDir
                        
                        let stepEnv=step.env
                        if(jobEnv && stepEnv) {
                            stepEnv = Object.assign(jobEnv,stepEnv)
                        } else if (jobEnv) {
                            stepEnv = jobEnv
                        }
                        
                        if(step.run) {
                            let stepShell=new Shell(step.shell,jobShell.name, stepEnv)
                            let stepRun=injectSystemEnv(step.run,stepEnv)
                            stepRun = stepShell.fixScript(stepRun)
                            let tmpDir = fs.mkdtempSync(path.join('.github','temp'))
                            let tmpFile = path.join(tmpDir,'job' + stepShell.fileExt)
                            fs.writeFileSync(tmpFile, stepRun);
                            let execFile = tmpFile;
                            if('\\' !== stepShell.pathSeparator) {
                                execFile=execFile.replaceAll('\\',stepShell.pathSeparator)
                            }
                            exec(execFile,{env: stepShell.env, stdio: 'inherit', cwd: stepWDir, shell:stepShell.name})
                            fs.rmSync(tmpDir,{recursive:true})
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