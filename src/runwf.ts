import * as fs from 'fs'
import * as path from'path' 
import { execFileSync, spawnSync } from 'child_process'
import * as yaml from 'js-yaml'
import { Shell, ShellName } from './Shell.js'
import { WorkflowData } from './WorkflowData.js'
import { injectSystemEnv, replaceExpression } from './EnviromentHelper.js'
import { ActionData } from './ActionData.js'
import { GitHubEnv } from './GitHubEnv.js'
import { WorkflowStep } from './WorkflowStep.js'
namespace workflowrunner {
    function stepRun(step: any, jobShell?: any, stepEnv?: GitHubEnv, stepWDir?: any) {
        let stepShell = new Shell(step.shell, jobShell.name, stepEnv)
        let stepRun = replaceExpression(step.run, stepEnv)
        stepRun = stepShell.fixScript(stepRun)
        let tempDir = fs.mkdtempSync(path.join(stepEnv.RUNNER_TEMP, 'temp'))
        let tmpFile = path.join(tempDir, 'job' + stepShell.fileExt)
        tmpFile = path.relative('.', tmpFile)

        fs.writeFileSync(tmpFile, stepRun)
        let execFile = tmpFile
        if ('\\' !== stepShell.pathSeparator) {
            execFile = execFile.replaceAll('\\', stepShell.pathSeparator)
        }

        try {
            let shellExec = stepShell.name == ShellName.bash ? "C:/Program Files/Git/bin/bash.exe" : stepShell.name.toString()
            execFileSync(execFile, { env: stepShell.env, stdio: 'inherit', cwd: stepWDir, shell: shellExec })
        } catch (e) {
            console.error(stepShell.name + 'script failed: ' + stepRun)
            throw e
        } finally {
            fs.rmSync(tempDir, { recursive: true })
        }
    }

    function stepUses(callingStep: WorkflowStep, stepEnv?: GitHubEnv, stepWDir: string = './') {
        if (!fs.existsSync(callingStep.uses)) {
            let uses = callingStep.uses.split('@')
            if (uses[1]) {
                execFileSync('git', ['clone', '--depth', '1', '--branch', uses[1], '--single-branch', stepEnv.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio: 'inherit', cwd: stepWDir, shell: true })
            } else {
                execFileSync('git', ['clone', '--depth', '1', '--single-branch', stepEnv.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio: 'inherit', cwd: stepWDir, shell: true })
            }
        }

        const yamlFile = callingStep.uses + '/action.yml'
        if (fs.existsSync(yamlFile)) {
            const yamlData = yaml.load(fs.readFileSync(yamlFile, 'utf8')) as ActionData
            
            console.info('action: ' + yamlData.name)
            if('composite' === yamlData.runs?.using) {
                yamlData.runs?.steps?.forEach(handleStep(stepWDir,stepEnv,null));
            } else if(yamlData.runs?.using?.match('node')) {
                const main = yamlData.runs?.main;

                const stepWith = Object.fromEntries(Object.keys(callingStep.with).map((key) => ['INPUT_' + key, callingStep.with[key]]));

                if(main) {
                    spawnSync(process.argv[0],[path.join(callingStep.uses,'/',main)], { env: stepWith, stdio: 'inherit', cwd: stepWDir})
                }
            } else {
                console.error('Action not supported!')
            }
        }
    }

    function handleStep(jobWDir?: string, jobEnv?: GitHubEnv, jobShell?: any): any {
        return step => {
            console.info(step.name)
            let stepWDir = step['working-directory'] ?? jobWDir

            let stepEnv = step.env
            if (jobEnv && stepEnv) {
                stepEnv = Object.assign(jobEnv, stepEnv)
            } else if (jobEnv) {
                stepEnv = jobEnv
            }

            //console.log('stepEnv: ' + stepEnv.msg)
            if (step.uses) {
                stepUses(step, stepEnv, stepWDir)
            }

            if (step.run) {
                stepRun(step, jobShell, stepEnv, stepWDir)
            }
        }
    }

    function handleWorkflow(yamlData: WorkflowData) {
        let globalShell: any = yamlData.defaults?.run?.shell
        globalShell = new Shell(globalShell)
        let globalWDir = '.'
        if (yamlData.defaults?.run) {
            globalWDir = yamlData.defaults.run['working-directory'] ?? globalWDir
        }
        let globalEnv = yamlData.env
        if (globalEnv) {
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
            let jobShell = job.defaults?.run?.shell
            jobShell = new Shell(jobShell, globalShell.name)
            let jobWDir = globalWDir
            if (job.default?.run) {
                jobWDir = job.default.run['working-directory'] ?? jobWDir
            }
            let jobEnv = job.env
            if (jobEnv && globalEnv) {
                jobEnv = Object.assign(globalEnv, jobEnv)
            } else if (globalEnv) {
                jobEnv = globalEnv
            }
            jobEnv.GITHUB_JOB = jobName

            if (job['runs-on']?.toLowerCase().match('windows')) {
                job.steps?.forEach(handleStep(jobWDir, jobEnv, jobShell))
            }

            else {
                console.warn("Skipped job '" + j[0] + "' cannot run on Windows!")
            }
        })
    }

    function main() {
        try {
            let ymlFile = process.argv[2];

            if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
                const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8')) as WorkflowData
                handleWorkflow(yamlData)
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
}