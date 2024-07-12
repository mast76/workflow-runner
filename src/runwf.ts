import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowData } from './WorkflowData.js';
import { WorkflowController } from './WorkflowController.js';
import { tmpdir } from 'os';
import { loadSecrets } from './SecretsHelper.js';
import { EnviromentHelper } from './EnviromentHelper.js';
import { Shell } from './Shell.js';
import { resolveRepositoryDir, resolveRepository } from './RepositoryHelper.js';

function main() {
    const argv = process.argv.slice(2); // skip node.exe and own path
    let yamlFile: string = null;
    let secretsFile: string = null;
    let varsFile: string = null;
    let keepTempFiles = false;
    let valid = true;
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
            EnviromentHelper.secrets = loadSecrets(secretsFile);
            EnviromentHelper.vars = varsFile ? yaml.load(fs.readFileSync(varsFile, 'utf8')) : {};
            Shell.workflowTmpDir = workflowTmpDir;
            
            new WorkflowController(workflowTmpDir, yamlFile).run();
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