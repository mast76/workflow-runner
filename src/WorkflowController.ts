import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import * as yaml from 'js-yaml';
import { Shell, ShellName } from './Shell.js';
import { WorkflowData } from './WorkflowData.js';
import { EnviromentHelper } from './EnviromentHelper.js';
import { ActionData } from './ActionData.js';
import { GitHubEnv } from './GitHubEnv.js';
import { WorkflowStep } from './WorkflowStep.js';
import { tmpdir } from 'os';

export class WorkflowController {
    enviromentHelper = new EnviromentHelper();

    workflowTmpDir: string;
    repositoryRoot: string;
    repository: string;
    secrets: {};
    vars: {};
    bashPath = '';

    constructor(workflowTmpDir: string, repositoy: string, repositoyRoot: string, vars : {}, secrets : {}) {
        this.workflowTmpDir = workflowTmpDir;
        this.repository = repositoy;
        this.secrets = secrets;
        this.vars = vars;
        this.repositoryRoot = repositoyRoot;

        this.bashPath = path.join(process.env['GIT_EXEC_PATH']??'','bash.exe');

        if(!fs.existsSync(this.bashPath)) {
            this.bashPath = "C:/Program Files/Git/bin/bash.exe"
        }
        
        if(!fs.existsSync(this.bashPath)) {
            let gitPath = execFileSync('where',['git'],{shell: 'cmd'}).toString();
            if(gitPath) {
                this.bashPath = path.join(path.dirname(gitPath),'bash.exe');
            }
        }
        
        if(!fs.existsSync(this.bashPath)) {
            console.warn('Could not find Git-bash!');
        }
    }
    
    injectSystemEnv(globalEnv: GitHubEnv = {} as GitHubEnv, yamlData: WorkflowData) : GitHubEnv {
        globalEnv.CI = 'false';
        globalEnv.GITHUB_ACTOR = globalEnv["USERNAME"];
        globalEnv.GITHUB_ACTOR_ID = globalEnv.GITHUB_ACTOR + '_ID';
        globalEnv.GITHUB_API_URL = 'https://api.github.com';
        globalEnv.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
        globalEnv.GITHUB_REPOSITORY = this.repository;
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
        let stepRun = this.enviromentHelper.replaceExpression(step.run, stepEnv, this.vars , this.secrets);
        stepRun = stepShell.fixScript(stepRun);
        let tmpFile = path.join(this.workflowTmpDir, step.name.replaceAll(/\s/g,'_') + stepShell.fileExt);
        
        fs.writeFileSync(tmpFile, stepRun);
        tmpFile = path.relative(stepWDir, tmpFile);

        let eFile = tmpFile;
        if ('\\' !== stepShell.pathSeparator) {
            eFile = eFile.replaceAll('\\', stepShell.pathSeparator);
        }

        try {
            const shellExec = stepShell.name == ShellName.bash ? this.bashPath : stepShell.name.toString();
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

                let stepWith = callingStep.with??{}; 
                stepWith = this.enviromentHelper.replaceExpressionInProperties(stepWith, null, this.vars, this.secrets);
                
                stepWith = Object.fromEntries(Object.keys(stepWith).map((key) => ['INPUT_' + key, stepWith[key]]));
                
                stepWith = Object.assign(stepEnv, stepWith);

                //console.log(stepEnv);

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
            console.info("Step: " + step.name);

            if(step.if) {
                let test = false;
                if(step.if.match(/\$\{\{/)) {
                    test = this.enviromentHelper.replaceExpression(step.if, jobEnv, this.vars , this.secrets);
                } else {
                    test = this.enviromentHelper.parseKey(step.if, jobEnv, this.vars , this.secrets);
                }

                if (!test) {
                    console.info('Step was skipped because of if-statement'); 
                    return;
                }
            }

            let stepWDir = step['working-directory'] ?? jobWDir;

            let stepEnv = this.enviromentHelper.replaceExpressionInProperties(step.env, null, this.vars, this.secrets);
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
        console.info('Job: ' + jobName);

        if(job.if) {
            let test = false;
            if(job.if.match(/\$\{\{/)) {
                test = this.enviromentHelper.replaceExpression(job.if, globalEnv, this.vars, this.secrets);
            } else {
                test = this.enviromentHelper.parseKey(job.if, globalEnv, this.vars, this.secrets);
            }
            
            if (!test) {
                console.info('Job was skipped because of if-statement'); 
                return;
            }
        }

        let jobShell = job.defaults?.run?.shell;
        jobShell = new Shell(jobShell, globalShell.name);
        let jobWDir = globalWDir;
        
        if (job.default?.run) {
            jobWDir = job.default.run['working-directory'] ?? jobWDir;
        }
        

        let jobSecrets = job.secrets;
        if('inherit' === jobSecrets) {
            jobSecrets = this.secrets;
        }

        let jobEnv = this.enviromentHelper.replaceExpressionInProperties(job.env, null, this.vars, this.secrets);
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

        let globalEnv = yamlData.env;
        if (globalEnv) {
            globalEnv = Object.assign(process.env, globalEnv);
        } else {
            globalEnv = process.env;
        }

        globalEnv = this.injectSystemEnv(globalEnv, yamlData);
        if(!fs.existsSync(globalEnv.GITHUB_WORKSPACE)) {
            fs.mkdirSync(globalEnv.GITHUB_WORKSPACE, { recursive: true });
        }
        
        let globalWDir = globalEnv.GITHUB_WORKSPACE;
        if (yamlData.defaults?.run) {
            globalWDir = yamlData.defaults.run['working-directory'] ?? globalWDir;
        }

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
