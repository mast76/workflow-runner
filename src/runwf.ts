import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { WorkflowData } from './WorkflowData.js'
import { handleWorkflow } from './WorkflowController.js'
async function main() {
    try {
        let ymlFile = process.argv[2];

        if(ymlFile && (ymlFile.toLowerCase().endsWith('.yml') || ymlFile.toLowerCase().endsWith('.yaml'))) {
            const yamlData = yaml.load(fs.readFileSync(ymlFile, 'utf8')) as WorkflowData
            handleWorkflow(yamlData)
        }
        else
        {
            console.error('Usage: node runwf.ts <my-yaml.yml>')
        }

    } catch (error) {
        console.error(error)
    }
}

main()