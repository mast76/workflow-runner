import { GitHubEnv } from "./GitHubEnv";
import { WorkflowData } from './WorkflowData.js'
import { tmpdir } from 'os'

export function replaceExpression(str, localEnv) {
    let m = /\${{\s*(\S*)\s*}}/gs;
    let r = /.*\${{\s*(\S*)\s*}}.*/gs;
    let s;
    str?.match(m)?.forEach(s => {
        let key = str.replace(r, '$1');
        var val = '';
        if (key?.startsWith('env.')) {
            key = key.substring(4);
            val = localEnv ? localEnv[key] : undefined;
        }
        if (key?.startsWith('github.')) {
            key = key.substring(4);
            val = localEnv ? localEnv[key] : undefined;
        }
        
        if (val) {
            str = str.replace(s, val);
        }
    });
    //  console.log(str)
    return str;
}

export function injectSystemEnv(globalEnv: any, yamlData: WorkflowData) {
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