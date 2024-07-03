import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'
import { WorkflowData } from './WorkflowData.js'
import { WorkflowController } from './WorkflowController.js'
import { tmpdir } from 'os'

function main() {
    let workflowTmpDir = fs.mkdtempSync(path.join(tmpdir(), 'workflow-'));
    try {
        let ymlFile = process.argv[2];

        if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
            const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8')) as WorkflowData;
            new WorkflowController(workflowTmpDir).handleWorkflow(yamlData);
        }
        else
        {
            console.error('Usage: node runwf.ts <my-yaml.yml>')
        }

    } catch (error) {
        console.error(error)
    } finally {
        fs.rmSync(workflowTmpDir, { recursive: true });
    }
}

main()