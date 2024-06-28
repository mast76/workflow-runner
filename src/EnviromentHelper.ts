import { GitHubEnv } from "./GitHubEnv";
import { WorkflowData } from './WorkflowData.js'
import { tmpdir } from 'os'

/**
 * https://docs.github.com/en/actions/learn-github-actions/contexts
 */
export enum GithubContext {
    /**
     * Information about the workflow run. For more information, see github context.
     */
    github,
    /**
     * Contains variables set in a workflow, job, or step. For more information, see env context.
     */
    env,
    /**
     * Contains variables set at the repository, organization, or environment levels. For more information, see vars context.
     */
    vars,
    /**
     * Information about the currently running job. For more information, see job context.
     */
    job,
    /**
     * For reusable workflows only, contains outputs of jobs from the reusable workflow. For more information, see jobs context.
     */
    jobs,
    /**
     * Information about the steps that have been run in the current job. For more information, see steps context.
     */
    steps,
    /**
     * Information about the runner that is running the current job. For more information, see runner context.
     */	
    runner,
    /**
     * Contains the names and values of secrets that are available to a workflow run. For more information, see secrets context.
     */
    secrets,
    /**
     * Information about the matrix execution strategy for the current job. For more information, see strategy context.
     */
    strategy,
    /**
     * Contains the matrix properties defined in the workflow that apply to the current job. For more information, see matrix context.
     */	
    matrix,
    /**
     * Contains the outputs of all jobs that are defined as a dependency of the current job. For more information, see needs context.
     */
    needs,
    /**
     * Contains the inputs of a reusable or manually triggered workflow. For more information, see inputs context.
     */
    inputs
}

export function replaceEnvVariables(key, localEnv : GitHubEnv) {
            
    let ctx = key.substring(0,key.indexOf('.'))
    //console.log(ctx)

    key = key.substring(key.indexOf('.')+1)
    let val=''
    
    switch (ctx) {
        case 'env':
            val = localEnv ? localEnv[key] : ''
            break
        case 'github':
            val = localEnv ? localEnv['GITHUB_' + key] : ''
            break
        case 'runner':
            val = localEnv ? localEnv['RUNNER_' + key] : ''
            break
        default:
            val = "''"
    }
    return val
}

export function parseKey(exp, localEnv : GitHubEnv) {
    exp = exp.trim()
    const mStr1 = /'([^'])'/gi
    const env = /[a-z]+\.[a-z]+/gi
    
    exp = exp.replaceAll("''","'")
    
    exp?.match(mStr1)?.forEach(m => {
        exp = exp.replace(m,'$1')
    })
    exp?.match(env)?.forEach(m =>  {
        exp = exp.replace(m, replaceEnvVariables(m, localEnv))
    })
    
    const valid = /^(\w|([<>!'"()\s][=]?)|(-[^=])||(==)|(&&)|(\|\|))*$/g 

    if(valid) {
        exp = eval(exp)
    }
    return exp
}

export function replaceExpression(str, localEnv : GitHubEnv) {
    const m = /\${{([^}]+)}}/gs;
    
    str?.match(m)?.forEach(s => {
        str = str.replace(m,parseKey(s, localEnv));
    });
    return str;
}

export function injectSystemEnv(globalEnv: any, yamlData: WorkflowData) : GitHubEnv {
    globalEnv = (globalEnv as GitHubEnv)
    globalEnv.CI = 'true'
    globalEnv.GITHUB_ACTOR = globalEnv["USERNAME"]
    globalEnv.GITHUB_ACTOR_ID = globalEnv.GITHUB_ACTOR + '_ID'
    globalEnv.GITHUB_API_URL = 'https://api.github.com'
    globalEnv.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
    globalEnv.GITHUB_SERVER_URL = 'https://github.com'
    globalEnv.GITHUB_WORKFLOW = yamlData.name
    globalEnv.RUNNER_ARCH = process.arch
    globalEnv.RUNNER_OS = 'Windows'
    globalEnv.RUNNER_NAME = globalEnv['COMPUTERNAME']
    globalEnv.RUNNER_TEMP = tmpdir()
    return globalEnv
}
