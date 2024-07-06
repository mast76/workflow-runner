import * as fs from 'fs'
import * as sc from '@tsmx/string-crypto'
import * as readline from 'readline-sync';
import * as yaml from 'js-yaml';

export function loadSecrets(secretFile: string, masterSecret?: string) : any {
    let secrets: {} = null;
    if(secretFile) {
        let encryptedSecrets = yaml.load(fs.readFileSync(secretFile, 'utf8'));
        if(!masterSecret) {
            masterSecret = readline.question("What's the master secret for decypting the secret file? ", { hideEchoBack: true });
        }

        secrets = getSecrets(encryptedSecrets, masterSecret);
    } 
    return secrets;
}

export function getSecrets(encryptedSecrets: any, masterSecret: string) : {} {
    let secrets: any = null;
    if(encryptedSecrets) {
        const  keys =  Object.keys(encryptedSecrets);
        secrets = keys.map((k) => [k, sc.decrypt(encryptedSecrets[k],{ key: masterSecret })]);
        secrets = Object.fromEntries(secrets);
    }
    return secrets;
}