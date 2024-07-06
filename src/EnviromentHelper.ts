import { GitHubEnv } from "./GitHubEnv";

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

export function replaceEnvVariables(key : string, localEnv?: GitHubEnv, secrets?: {}) : string {
    console.log(key);
            
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
        case 'secrets':
            console.log(secrets);
            if(secrets) {
                val = secrets[key];
            } else {
                console.error('Secrets was refered but not defined!');
                val = ''
            }
            break
        default:
            val = ''
    }
    console.log(val);
    return '"' + val + '"'
}

export function parseKey(exp : string, localEnv : GitHubEnv, secrets: {}) : any {
    exp = exp.trim()
    const mStr1 = /'([^'])'/gi
    const env = /[a-z]+\.[a-z]+/gi
    
    exp = exp.replaceAll("''","\\'")
    
    exp?.match(mStr1)?.forEach(m => {
        exp = exp.replace(m,'$1')
    })
    exp?.match(env)?.forEach(m =>  {
        exp = exp.replace(m, replaceEnvVariables(m, localEnv, secrets))
    })
    
    const valid = /^(\w|([<>!'"()\s][=]?)|(-[^=])||(==)|(&&)|(\|\|))*$/g 

    if(valid) {
        exp = eval(exp)
    }
    
    return exp
}

export function replaceExpression(str : string, localEnv : GitHubEnv, secrets: {}) : any {
    const m = /\${{([^}]+)}}/gs;
    
    str?.match(m)?.forEach(s => {
        let pk = parseKey(s.replace(m, '$1' ), localEnv, secrets);
        if(str.trim() === s) {
            str = pk;
        } else {
            str = str.replace(m,pk);
        }
    });
    
    //console.log(str);
    return str;
}

export function replaceExpressionInProperties(obj = {}, localEnv : GitHubEnv, secrets: {}) : any {
    const map = Object.keys(obj).map((key) => [key, replaceExpression(obj[key],localEnv,secrets)]);
    return Object.fromEntries(map);
}

