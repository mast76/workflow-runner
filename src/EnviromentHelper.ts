import { match } from "assert";
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

export class EnviromentHelper {
    static vars: {};
    static secrets: {};

    static replaceEnvVariables(key : string, localEnv?: GitHubEnv) : string {
        //console.log(vars);
        //console.log(secrets);
                
        let ctx = key.substring(0,key.indexOf('.'));
        //console.log(ctx)
        
        key = key.substring(key.indexOf('.')+1);
        //console.log(key);
        
        let val : any ='';
        
        switch (ctx) {
            case 'env':
                val = localEnv ? localEnv[key] : '';
                break;
            case 'github':
                val = localEnv ? localEnv['GITHUB_' + key.toUpperCase()] : '';
                break;
            case 'input':
                val = localEnv ? localEnv['INPUT_' + key] : '';
                break;
            case 'runner':
                val = localEnv ? localEnv['RUNNER_' + key.toUpperCase()] : '';
                break;
            case 'vars':
                if(EnviromentHelper.vars) {
                    val = EnviromentHelper.vars[key];
                } else {
                    console.error('Vars context was refered but not defined!');
                    val = '';
                }
                break
            case 'secrets':
                //console.log(secrets);
                if(EnviromentHelper.secrets) {
                    val = EnviromentHelper.secrets[key];
                } else {
                    console.error('Secrets context was refered but not defined!');
                    val = '';
                }
                break;
            default:
                val = '';
        }

        const shouldEval = /^((true)|(false)|(null)|(-?\d+)|(-?\d*(\.\d+)(e-?\d+)?)|(-?0x[\dA-F]+))$/i;
        
        //console.log(typeof(val) + ": " + val);

        if((typeof val) === 'string' && val.match(shouldEval)) {
            val = eval(val);
        }

        //console.log(val);
        return val;
    }

    static parseKey(exp : string, localEnv : GitHubEnv) : any {
        exp = exp.trim();
        const mStr1 = /('([^']|((?=')).)+?')/g;
        const env = /[a-z]+\.[a-z_\d]+/gi;
        
        //console.log("parseKey: "+ exp);
        exp = exp.replaceAll(mStr1, '$1');
        
        exp = exp.replaceAll("''","\\'");

        exp?.match(env)?.forEach(m =>  {
            exp = exp.replace(m, this.replaceEnvVariables(m, localEnv));
        }) 

        const hasQoutes = /^["'].*["']$/;
        const hasSpace = /\s/;
        const isKeyword = /^(true)|(false)|(null)$/;
        
        const shouldEval = /^-?(true)|(false)|(null)|(\d*(\.\d+))|([\dA-F]+)$/i;

        if(!exp.match(hasQoutes) && exp.match(hasSpace) && ! exp.match(isKeyword)) {
            exp = '"' + exp + '"';
        }

        const valid = /^["'-]?(\w|[\\\.'"()\s]|([<>!][=]?)|(-[^=])||(==)|(&&)|(\|\|))+$/;

        if (exp?.match(valid)) {
            //console.log('eval: ' + exp);
            exp = eval(exp);
        }
        //console.log('pk:' + exp);
        return exp;
    }

    static statementMatcher = /\${{([^}]+)}}?/gs;

    static replaceExpression(str : string, localEnv : GitHubEnv) : any {
        
        str?.match(this.statementMatcher)?.forEach(s => {
            //console.log(s)
            let pk = this.parseKey(s.replace(this.statementMatcher, '$1' ), localEnv);
            //console.log(pk)
            if(str.trim() === s) {
                str = pk;
            } else {
                str = str.replace(this.statementMatcher,pk);
            }
        });
        
        //console.log(str);
        return str;
    }

    static replaceExpressionInProperties(obj = {}, localEnv : GitHubEnv) : any {
        const map = Object.keys(obj).map((key) => [key, this.replaceExpression(obj[key],localEnv)]);
        return Object.fromEntries(map);
    }
}

