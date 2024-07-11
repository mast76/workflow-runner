import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowData } from './WorkflowData.js';
import { WorkflowController } from './WorkflowController.js';
import { tmpdir } from 'os';
import { parse } from 'ini';
import { loadSecrets } from './SecretsHelper.js';
import { EnviromentHelper } from './EnviromentHelper.js';
import { Shell } from './Shell.js';

function resolveRepositoryDir(yml: string) : string {
    let lookupDir = path.dirname(yml)

    for (let index = 0; index < 10; index++){
        let chkPth = path.join(lookupDir,'.git','config') 
        //console.log(chkPth)
        if(fs.existsSync(chkPth)) {
            break;
        }

        lookupDir = path.join(lookupDir,'..')
    }

    return lookupDir
}

function resolveRepository(lookupDir: string) : string {

    let gitCfgPath = path.join(lookupDir,'.git','config');

    let repository = null;
    if(gitCfgPath) {
        let data = parse(fs.readFileSync(gitCfgPath).toString());
        let dataMap = Object.keys(data).map((key) => [key, data[key]]);
        //console.log(dataMap)

        let url = dataMap.find( f => f[0].startsWith('remote'))[1].url;
        //console.log(dataMap)

        let m = url.match(/^\s*((https?:\/\/.+\/)|(.+\:))([^\/]+\/[^\.\s]+)(\.git)?\s*$/);
        
        //console.log(m);
        repository = m[4];
    }

    return repository;
}

function main() {
    const argv = process.argv.slice(2); // skip node.exe and own path
    let keepTempFiles = false;
    let yamlFile = null;
    let valid = true;
    let secretsFile = null;
    let varsFile = null;
    for (let a = argv.shift() ; a && valid; a = argv.shift()) {
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
            case '-vf':    
            case '--varsFile':
                varsFile = argv.shift();
                if(!varsFile) {
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


    const workflowTmpDir = fs.mkdtempSync(path.join(tmpdir(), 'workflow-'));
    try {

        if(valid) {
            const yamlData = yaml.load(fs.readFileSync(yamlFile, 'utf8')) as WorkflowData;
            const repositoryRoot = resolveRepositoryDir(yamlFile)
            const repository = resolveRepository(repositoryRoot);
            EnviromentHelper.secrets = loadSecrets(secretsFile);
            EnviromentHelper.vars = varsFile ? yaml.load(fs.readFileSync(varsFile, 'utf8')) : {};
            Shell.workflowTmpDir = workflowTmpDir;
            
            new WorkflowController(repository, repositoryRoot, workflowTmpDir).handleWorkflow(yamlData);
        }
        else
        {
            console.error('Usage: node <path-to-runwf.js> <path-to-some-workflow-file> [<-sf | --secretsFile> path-to-secrets-file] [<-vf | --varsFile> path-to-vars-file] [--help] [--keepTempFiles]');
        }

    } catch (error) {
        console.error(error);
    } finally {
        if(!keepTempFiles) {
            fs.rmSync(workflowTmpDir, { recursive: true });
        } else {
            console.warn('Leaving: ' + workflowTmpDir);
        }
    }
}

main()