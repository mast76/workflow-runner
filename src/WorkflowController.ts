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
import { resolveRepository, resolveRepositoryDir } from './RepositoryHelper.js';

export class WorkflowController {
    currentWorkflowFile: string;
    repositoryRoot: string;
    repository: string;
    secrets: {};
    vars: {};
    workflowTmpDir: string;
    static gitPath = '';

    static {
        this.gitPath = path.join(process.env['GIT_EXEC_PATH']??'','git.exe');

        if(!fs.existsSync(this.gitPath)) {
            this.gitPath = "C:/Program Files/Git/bin/git.exe"
        }
        
        if(!fs.existsSync(this.gitPath)) {
            this.gitPath = execFileSync('where',['git'],{shell: 'cmd'}).toString();
        }
        
        if(fs.existsSync(this.gitPath)) {
            Shell.bashPath = path.join(path.dirname(this.gitPath),'bash.exe'); 
        } else {
            console.warn('Could not find Git-bash!');
        }
    }

    constructor(workflowTmpDir: string, yamlFile: string) {
        this.currentWorkflowFile  = yamlFile;
        this.workflowTmpDir = workflowTmpDir;
        this.repositoryRoot = resolveRepositoryDir(yamlFile)
        this.repository = resolveRepository(this.repositoryRoot);
    }

    run(inputs?: {}) {
        const yamlData = yaml.load(fs.readFileSync(this.currentWorkflowFile, 'utf8')) as WorkflowData;

        console.info('Workflow: ' + yamlData.name + ' - start');
        
        let globalEnv = yamlData.env;
        if (globalEnv) {
            globalEnv = Object.assign(process.env, globalEnv);
        } else {
            globalEnv = process.env;
        }

        if(inputs) {
            const inputsEnv = Object.fromEntries(Object.keys(inputs).map((key) => ['INPUT_' + key, inputs[key]]));
            globalEnv = Object.assign(globalEnv, inputsEnv);
        }

        globalEnv = this.injectSystemEnv(globalEnv, yamlData);
        if(!fs.existsSync(globalEnv.GITHUB_WORKSPACE)) {
            fs.mkdirSync(globalEnv.GITHUB_WORKSPACE, { recursive: true });
        }
        
        let globalWDir = globalEnv.GITHUB_WORKSPACE;
        if (yamlData.defaults?.run) {
            globalWDir = yamlData.defaults.run['working-directory'] ?? globalWDir;
        }
        
        let globalShell: any = yamlData.defaults?.run?.shell;
        globalShell = new Shell(globalShell,null,globalEnv,globalWDir);

        let jobs = Object.keys(yamlData.jobs).map(key => [key, yamlData.jobs[key]]);

        let ready = jobs?.filter(jobStep => !jobStep[1].needs);

        let readyNames: string[] = [];

        while(ready && ready.length) {

            ready.forEach(jobStep => {
                readyNames.push(jobStep[0]);
                this.handleJob(jobStep, globalShell);
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
        
        console.info('Workflow: ' + yamlData.name + ' - end');
    }
    
    injectSystemEnv(globalEnv: GitHubEnv = {} as GitHubEnv, yamlData: WorkflowData) : GitHubEnv {
        globalEnv.CI = 'false';
        globalEnv.GITHUB_ACTOR = globalEnv["USERNAME"];
        globalEnv.GITHUB_ACTOR_ID = globalEnv.GITHUB_ACTOR + '_ID';
        globalEnv.GITHUB_API_URL = 'https://api.github.com';
        globalEnv.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
        globalEnv.GITHUB_REPOSITORY = this.repository;
        globalEnv.GITHUB_SERVER_URL = 'https://github.com';
        globalEnv.GITHUB_WORKFLOW = yamlData.name ?? this.currentWorkflowFile;
        globalEnv.GITHUB_WORKSPACE = path.join(this.workflowTmpDir, 'work');
        globalEnv.RUNNER_ARCH = process.arch;
        globalEnv.RUNNER_OS = 'Windows';
        globalEnv.RUNNER_NAME = globalEnv['COMPUTERNAME'];
        globalEnv.RUNNER_TEMP = tmpdir();
        return globalEnv;
    }

    stepUses(callingStep: WorkflowStep, stepShell: Shell) {
        const uses : string = callingStep.uses?.trim();
        let actionPath: string = null;
        if (uses && stepShell) {
            
            if(uses.startsWith('./')) {
                actionPath = path.join(this.repositoryRoot,uses);
            } else {
                actionPath = path.join(this.workflowTmpDir,uses);

                if (!fs.existsSync(actionPath)) {
                    const uses = callingStep.uses.split('@');
                    if (uses.length === 2) {
                        execFileSync(WorkflowController.gitPath, ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--branch', uses[1], '--single-branch', stepShell.env.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio:'inherit',  cwd: this.workflowTmpDir, shell: false });
                    } else {
                        execFileSync(WorkflowController.gitPath, ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--single-branch', stepShell.env.GITHUB_SERVER_URL + '/' + uses[0] + '.git', callingStep.uses], { stdio:'inherit', cwd: this.workflowTmpDir, shell: false });
                    }
                }
            }

            const yamlFile = path.join(actionPath,'action.yml');
            if (fs.existsSync(yamlFile)) {
                const yamlData = yaml.load(fs.readFileSync(yamlFile, 'utf8')) as ActionData;

                console.info('Action: ' + yamlData.name + ' - start');

                if ('composite' === yamlData.runs?.using) {
                    yamlData.runs?.steps?.forEach(this.handleStep(stepShell));
                } else if (yamlData.runs?.using?.match('node')) {
                    const pre_if = EnviromentHelper.replaceExpression(yamlData.runs['pre-if'], stepShell.env);
                    const pre = yamlData.runs.pre;
                    const main = yamlData.runs.main;
                    const post_if = EnviromentHelper.replaceExpression(yamlData.runs['post-if'], stepShell.env);
                    const post = yamlData.runs.post;

                    let stepWith = callingStep.with??{}; 
                    stepWith = EnviromentHelper.replaceExpressionInProperties(stepWith, null);
                    
                    stepWith = Object.fromEntries(Object.keys(stepWith).map((key) => ['INPUT_' + key, stepWith[key]]));
                    
                    stepWith = Object.assign(stepShell.env, stepWith);

                    //console.log(stepEnv);

                    if (pre && pre_if) {
                        spawnSync(process.argv[0], [path.join(actionPath, pre)], { env: stepWith, stdio: 'inherit', cwd: stepShell.wkDir });
                    }

                    if (main) {
                        spawnSync(process.argv[0], [path.join(actionPath, main)], { env: stepWith, stdio: 'inherit', cwd: stepShell.wkDir });
                    }

                    if (post && post_if) {
                        spawnSync(process.argv[0], [path.join(actionPath, post)], { env: stepWith, stdio: 'inherit', cwd: stepShell.wkDir });
                    }
                } else {
                    console.error('Action not supported!');
                }
                
                console.info('Action: ' + yamlData.name + ' - end');
            } else {
                console.log('Action: "' + yamlFile + '" file not found!');
            }
        }
    }

    handleStep(jobShell?: Shell): any {
        return step => {
            console.info("Step: " + step.name);

            if(step.if) {
                let test = false;
                if(step.if.match(/\$\{\{/)) {
                    test = EnviromentHelper.replaceExpression(step.if, jobShell.env);
                } else {
                    test = EnviromentHelper.parseKey(step.if, jobShell.env);
                }

                if (!test) {
                    console.info('Step was skipped because of if-statement'); 
                    return;
                }
            }

            let stepWDir = step['working-directory'];

            let stepEnv = EnviromentHelper.replaceExpressionInProperties(step.env, null);

            const stepShell = new Shell(step.shell, jobShell, stepEnv, stepWDir, step.run);

            //console.log('stepEnv: ' + stepEnv.msg)
            if (step.uses) {
                this.stepUses(step, stepShell);
            }

            if (step.run) {
                try {
                    execFileSync(stepShell.runFile, stepShell.args, { stdio: 'inherit', env: stepShell.env, cwd: stepShell.wkDir, shell: stepShell.shellExe.toString() });
                } catch (e) {
                    console.error(stepShell.name + 'script failed: ' + step.run );
                    throw e;
                }
            }
        };
    }

    usesJob(job: any, jobShell: Shell) {
        const uses : string = job?.uses?.trim();
        if (uses && jobShell) {
            if(uses.startsWith('./') && uses.endsWith('.yml')) {
                new WorkflowController(this.workflowTmpDir,path.join(this.repositoryRoot, uses)).run(job.with);
            } else {
                const wfPath = path.join(this.workflowTmpDir, uses);
                if (!fs.existsSync(wfPath)) {
                    const usesArray = uses.split('@');
                    const ownerRepo = usesArray[0].match(/^([^\/]+\/[^\/]+)/)[0];
                    const filePath = path.normalize(usesArray[0].substring(ownerRepo.length));
                    if (usesArray.length === 2) {
                        execFileSync(WorkflowController.gitPath, ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--branch', usesArray[1], '--single-branch', jobShell.env.GITHUB_SERVER_URL + '/' + ownerRepo, ownerRepo + "@" + usesArray[1]], { stdio:'inherit',  cwd: this.workflowTmpDir, shell: false });
                        new WorkflowController(this.workflowTmpDir,path.join(this.workflowTmpDir, ownerRepo + "@" + usesArray[1], filePath)).run(job.with);
                    } else {
                        execFileSync(WorkflowController.gitPath, ['-c', 'advice.detachedHead=false', 'clone', '--depth', '1', '--single-branch', jobShell.env.GITHUB_SERVER_URL + '/' + ownerRepo, ownerRepo], { stdio:'inherit', cwd: this.workflowTmpDir, shell: false });
                        new WorkflowController(this.workflowTmpDir,path.join(this.workflowTmpDir, ownerRepo, filePath)).run(job.with);
                    }
                }
            }
        }
    }

    handleJob(jobStep: any[], globalShell: Shell) {
        const jobName = jobStep[0];
        const job = jobStep[1];
        console.info('Job: ' + jobName);

        if(job.if) {
            let test = false;
            if(job.if.match(/\$\{\{/)) {
                test = EnviromentHelper.replaceExpression(job.if, globalShell.env);
            } else {
                test = EnviromentHelper.parseKey(job.if, globalShell.env);
            }
            
            if (!test) {
                console.info('Job was skipped because of if-statement'); 
                return;
            }
        }

        let jobShell = job.defaults?.run?.shell;
        let jobWDir = job.defaults?.run['working-directory'];
        

        let jobSecrets = job.secrets;
        if('inherit' === jobSecrets) {
            jobSecrets = this.secrets;
        }

        let jobEnv = EnviromentHelper.replaceExpressionInProperties(job.env, null);

        jobEnv.GITHUB_JOB = jobName;
        
        jobShell = new Shell(jobShell, globalShell, jobEnv, jobWDir);

        
        if(job.uses) {
            this.usesJob(job, jobShell);
        } else {
            if (job['runs-on']?.toLowerCase().match('windows')) {
                    job.steps?.forEach( this.handleStep(jobShell));
            } else {
                console.warn("Skipped job '" + jobStep[0] + "' cannot run on Windows!");
            }
        }
    
    }
}
