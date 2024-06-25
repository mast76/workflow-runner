import * as fs from 'fs'
import * as path from'path' 
import { execFileSync } from 'child_process'
import * as yaml from 'js-yaml'
import { Shell } from './Shell.js'
import { WorkflowData } from './WorkflowData.js'
import { injectSystemEnv, replaceExpression } from './EnviromentHelper.js'

function main() {
    try {
        let ymlFile = process.argv[2];

        if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
            const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8')) as WorkflowData
            let globalShell = yamlData.defaults?.run?.shell
            globalShell = new Shell(globalShell)
            let globalWDir=yamlData.defaults['working-directory']
            let globalEnv=yamlData.env
            if(globalEnv) {
                globalEnv = Object.assign(process.env, globalEnv)
            } else if (globalEnv) {
                globalEnv = process.env
            }
            
            globalEnv = injectSystemEnv(globalEnv, yamlData)

            let jobs = Object.keys(yamlData.jobs).map((key) => [key, yamlData.jobs[key]])

            jobs?.forEach(j => {
                let jobName = j[0]
                console.log(jobName)
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
                jobEnv.GITHUB_JOB = jobName

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
                            let stepRun=replaceExpression(step.run,stepEnv)
                            stepRun = stepShell.fixScript(stepRun)
                            let tempDir = fs.mkdtempSync(path.join(stepEnv.RUNNER_TEMP,'temp'))
                            let tmpFile = path.join(tempDir,'job' + stepShell.fileExt)
                            tmpFile = path.relative('.', tmpFile)
                            
                            fs.writeFileSync(tmpFile, stepRun);
                            let execFile = tmpFile;
                            if('\\' !== stepShell.pathSeparator) {
                                execFile=execFile.replaceAll('\\',stepShell.pathSeparator)
                            }

                            execFileSync(execFile, {env: stepShell.env, stdio: 'inherit', cwd: stepWDir, shell:stepShell.name.toString()} )
                            fs.rmSync(tempDir,{recursive:true})
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


