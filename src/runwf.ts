import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowData } from './WorkflowData.js';
import { WorkflowController } from './WorkflowController.js';
import { tmpdir } from 'os';
import { parse } from 'ini';
import { loadSecrets } from './SecretsHelper.js';

function resolveRepository(yml: string) : string {
    let lookupDir = path.dirname(yml)

    let gitCfgPath = null;

    for (let index = 0; index < 10; index++){
        let chkPth = path.join(lookupDir,'.git','config') 
        //console.log(chkPth)
        if(fs.existsSync(chkPth)) {
            //console.log('================')
            gitCfgPath = chkPth;
            break;
        }

        lookupDir = path.join(lookupDir,'..')
    }

    let repository = null;
    if(gitCfgPath) {
        let data = parse(fs.readFileSync(gitCfgPath).toString());
        let dataMap = Object.keys(data).map((key) => [key, data[key]]);
        //console.log(dataMap)

        let url = dataMap.find( f => f[0].startsWith('remote'))[1].url;
        //console.log(dataMap)

        let m = url.match(/.+\:(.+)\.git/);
        //console.log(m[1])
        repository = m[1];
    }
    return repository;
}

function main() {
    const argv = process.argv.slice(2); // skip node.exe and own path
    let keepTempFiles = true;
    let yamlFile = null;
    let valid = true;
    let secretsFile = null;
    for (let a = argv.shift() ; a && valid; a = argv.shift()) {
        console.log(a)
        switch (a) {
            case '-ktf':
            case '--keepTempFiles':
                keepTempFiles = true;
                break;
            case '-sf':    
            case '--secretsFile':
                secretsFile = argv.shift();
                if(!secretsFile) {
                    valid = false;
                }
                break;
            case '--help':
                valid = false;
                break;
            default:
                if(!yamlFile && (a?.toLowerCase().endsWith('.yml') || a?.toLowerCase().endsWith('.yaml'))) {
                    yamlFile = a;
                } else {
                    valid = false;
                }
                break;
        }
    }


    let workflowTmpDir = fs.mkdtempSync(path.join(tmpdir(), 'workflow-'));
    try {

        if(valid) {
            const yamlData = yaml.load(fs.readFileSync(yamlFile, 'utf8')) as WorkflowData;
            const repository = resolveRepository(yamlFile);
            const secrets = loadSecrets(secretsFile);
            new WorkflowController(workflowTmpDir, repository, secrets).handleWorkflow(yamlData);
        }
        else
        {
            console.error('Usage: node [<path-to-runwf.js> <path-to-workflow>] [--help] [--keepTempFiles]' )
        }

    } catch (error) {
        console.error(error)
    } finally {
        if(!keepTempFiles) {
            fs.rmSync(workflowTmpDir, { recursive: true });
        }
    }
}

main()