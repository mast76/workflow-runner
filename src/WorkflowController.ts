import * as fs from 'fs';
import * as path from 'path';
import { execFile, execFileSync, spawn, spawnSync } from 'child_process';
import * as yaml from 'js-yaml';
import { Shell, ShellName } from './Shell.js';
import { WorkflowData } from './WorkflowData.js';
import { replaceExpression } from './EnviromentHelper.js';
import { ActionData } from './ActionData.js';
import { GitHubEnv } from './GitHubEnv.js';
import { WorkflowStep } from './WorkflowStep.js';
import { tmpdir } from 'os';

export class WorkflowController {

    workflowTmpDir: string;
    repositoy: string;

    constructor(workflowTmpDir: string, repositoy: string) {
        this.workflowTmpDir = workflowTmpDir;
        this.repositoy = repositoy;
    }
    
    injectSystemEnv(globalEnv: GitHubEnv = {} as GitHubEnv, yamlData: WorkflowData) : GitHubEnv {
        globalEnv.CI = 'true';
        globalEnv.GITHUB_ACTOR = globalEnv["USERNAME"];
        globalEnv.GITHUB_ACTOR_ID = globalEnv.GITHUB_ACTOR + '_ID';
        globalEnv.GITHUB_API_URL = 'https://api.github.com';
        globalEnv.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
        globalEnv.GITHUB_REPOSITORY = this.repositoy;
        globalEnv.GITHUB_SERVER_URL = 'https://github.com';
        globalEnv.GITHUB_WORKFLOW = yamlData.name;
        globalEnv.GITHUB_WORKSPACE = path.join(this.workflowTmpDir, 'work');
        globalEnv.RUNNER_ARCH = process.arch;
        globalEnv.RUNNER_OS = 'Windows';
        globalEnv.RUNNER_NAME = globalEnv['COMPUTERNAME'];
        globalEnv.RUNNER_TEMP = tmpdir();
        return globalEnv;
    }

    stepRun(step: any, jobShell?: any, stepEnv?: GitHubEnv, stepWDir?: any) {
        const stepShell = new Shell(step.shell, jobShell.name, stepEnv);
        let stepRun = replaceExpression(step.run, stepEnv);
        stepRun = stepShell.fixScript(stepRun);
        let tmpFile = path.join(this.workflowTmpDir, 'job' + stepShell.fileExt);
        tmpFile = path.relative('.', tmpFile);

        fs.writeFileSync(tmpFile, stepRun);
        let eFile = tmpFile;
        if ('\\' !== stepShell.pathSeparator) {
            eFile = eFile.replaceAll('\\', stepShell.pathSeparator);
        }

        try {
            const shellExec = stepShell.name == ShellName.bash ? "C:/Program Files/Git/bin/bash.exe" : stepShell.name.toString();
            execFileSync(eFile, { stdio: 'inherit', env: stepShell.env, cwd: stepWDir, shell: shellExec });
        } catch (e) {
            console.error(stepShell.name + 'script failed: ' + stepRun);
            throw e;
        }
    }

    stepUses(callingStep: WorkflowStep, stepEnv?: GitHubEnv, stepWDir: string = './') {
        const actionPath = path.join(this.workflowTmpDir,callingStep.uses);
        if (!fs.existsSync(actionPath)) {
            const uses = callingStep.uses.split('@');
            if (uses[1]) {
                execFileSync('git', ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--branch', uses[1], '--single-branch', stepEnv.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio:'inherit',  cwd: this.workflowTmpDir, shell: true });
            } else {
                execFileSync('git', ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--single-branch', stepEnv.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio:'inherit', cwd: this.workflowTmpDir, shell: true });
            }
        }


        const yamlFile = path.join(actionPath,'action.yml');
        if (fs.existsSync(yamlFile)) {
            const yamlData = yaml.load(fs.readFileSync(yamlFile, 'utf8')) as ActionData;

            console.info('action: ' + yamlData.name);
            if ('composite' === yamlData.runs?.using) {
                yamlData.runs?.steps?.forEach(this.handleStep(stepWDir, stepEnv, null));
            } else if (yamlData.runs?.using?.match('node')) {
                const main = yamlData.runs?.main;

                let stepWith = Object.fromEntries(Object.keys(callingStep.with??{}).map((key) => ['INPUT_' + key, callingStep.with[key]]));
                
                stepWith.GITHUB_WORKSPACE = stepEnv.GITHUB_WORKSPACE;
                stepWith.GITHUB_REPOSITORY = stepEnv.GITHUB_REPOSITORY;

                if(!fs.existsSync(stepWith.GITHUB_WORKSPACE)) {
                    fs.mkdirSync(stepWith.GITHUB_WORKSPACE, {recursive: true});
                }

                if (main) {
                    spawnSync(process.argv[0], [path.join(actionPath, '/', main)], { env: stepWith, stdio: 'inherit', cwd: stepWDir });
                }
            } else {
                console.error('Action not supported!');
            }
        }
    }

    handleStep(jobWDir?: string, jobEnv?: GitHubEnv, jobShell?: any): any {
        return step => {
            console.info(step.name);
            let stepWDir = step['working-directory'] ?? jobWDir;

            let stepEnv = step.env;
            if (jobEnv && stepEnv) {
                stepEnv = Object.assign(jobEnv, stepEnv);
            } else if (jobEnv) {
                stepEnv = jobEnv;
            }

            //console.log('stepEnv: ' + stepEnv.msg)
            if (step.uses) {
                this.stepUses(step, stepEnv, stepWDir);
            }

            if (step.run) {
                this.stepRun(step, jobShell, stepEnv, stepWDir);
            }
        };
    }

    handleJob(jobStep: any[], globalShell: any, globalWDir: string, globalEnv: any) {
        const jobName = jobStep[0];
        const job = jobStep[1];
        console.log(jobName);

        let jobShell = job.defaults?.run?.shell;
        jobShell = new Shell(jobShell, globalShell.name);
        let jobWDir = globalWDir;
        
        if (job.default?.run) {
            jobWDir = job.default.run['working-directory'] ?? jobWDir;
        }
        let jobEnv = job.env;
        if (jobEnv && globalEnv) {
            jobEnv = Object.assign(globalEnv, jobEnv);
        } else if (globalEnv) {
            jobEnv = globalEnv;
        }
        jobEnv.GITHUB_JOB = jobName;

        if (job['runs-on']?.toLowerCase().match('windows')) {
            job.steps?.forEach( this.handleStep(jobWDir, jobEnv, jobShell));
        } else {
            console.warn("Skipped job '" + jobStep[0] + "' cannot run on Windows!");
        }
    }

    handleWorkflow(yamlData: WorkflowData) {
        let globalShell: any = yamlData.defaults?.run?.shell;
        globalShell = new Shell(globalShell);
        let globalWDir = '.';
        if (yamlData.defaults?.run) {
            globalWDir = yamlData.defaults.run['working-directory'] ?? globalWDir;
        }
        let globalEnv = yamlData.env;
        if (globalEnv) {
            globalEnv = Object.assign(process.env, globalEnv);
        } else if (globalEnv) {
            globalEnv = process.env;
        }

        globalEnv = this.injectSystemEnv(globalEnv, yamlData);
        
        let jobs = Object.keys(yamlData.jobs).map(key => [key, yamlData.jobs[key]]);

        let ready = jobs?.filter(jobStep => !jobStep[1].needs);

        let readyNames: string[] = [];

        while(ready && ready.length) {

            ready.forEach(jobStep => {
                readyNames.push(jobStep[0]);
                this.handleJob(jobStep, globalShell, globalWDir, globalEnv);
            });

            jobs = jobs.filter(j => !ready.includes(j));

            ready = jobs.filter(jobStep => {
                let test = readyNames.some(r => r === jobStep[1].needs);
                if(!test && Array.isArray(jobStep[1].needs)) {
                    test = jobStep[1].needs?.every((need: string) => readyNames.some(r => r === need));
                }
                return test;
            });
        }

    }
}
