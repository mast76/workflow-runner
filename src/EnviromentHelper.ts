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

export function parseKey(key) {
    key = key.trim()
    const mInt = /^-?(\d+|(0x[0-9A-F]+))$/gi
    const mFlt = /^-?((\d*.\d+)(e-?\d+)?)$/gi
    const mStr1 = /^'(.+)'$/gi
    const mStr2 = /^"(.+)"$/gi
    
    if(key?.match(mStr1)) {
      key = key.replace(mStr1,'$1')
      key = key.replaceAll("''","'")
    } if(key?.match(mStr2)) {
      key = key.replace(mStr2,'$1')
      key = key.replaceAll('""','"')
    } else if(key?.match(mInt)) {
        key = Number.parseInt(key)
    } else if(key?.match(mFlt)) {
        key = Number.parseFloat(key)
    } else if(key == 'true') {
        key = true
    } else if(key == 'false') {
        key = false
    } else if(key == 'null') {
        key = null
    }

    return key
}

export function replaceExpression(str, localEnv : GitHubEnv) {
    str = parseKey(str)

    const m = /\${{([^}]+)}}/gs;
    const c = /^\w+\.\w+/g
    
    let s;
    str?.match(m)?.forEach(s => {
        //console.log('s:' + s)
        let key = s.replace(m, '$1');
        key = parseKey(key)
        //console.log('key:' + key)
        var val = '';
        
        if(key.match(c)) {
            
            let ctx = key.substring(0,key.indexOf('.'))
            ctx = GithubContext[ctx]
            //console.log(ctx)

            key = key.substring(key.indexOf('.')+1)

            switch (ctx) {
                case GithubContext.env:
                    val = localEnv ? localEnv[key] : ''
                    break
                case GithubContext.github:
                    val = localEnv ? localEnv['GITHUB_' + key] : ''
                    break
                case GithubContext.runner:
                    val = localEnv ? localEnv['RUNNER_' + key] : ''
                    break
                default:
                    val = 'Not Implemented!'
            }
        }
        
        //console.log('val:' + val)
        
        if (val) {
            str = str.replace(s, val);
        }
    });
    //console.log(str)
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