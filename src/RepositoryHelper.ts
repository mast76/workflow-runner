import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'ini';

export function resolveRepositoryDir(yml: string): string {
    let lookupDir = path.dirname(yml);

    for (let index = 0; index < 10; index++) {
        let chkPth = path.join(lookupDir, '.git', 'config');
        //console.log(chkPth)
        if (fs.existsSync(chkPth)) {
            break;
        }

        lookupDir = path.join(lookupDir, '..');
    }

    return lookupDir;
}
export function resolveRepository(lookupDir: string): string {

    let gitCfgPath = path.join(lookupDir, '.git', 'config');

    let repository = null;
    if (gitCfgPath) {
        let data = parse(fs.readFileSync(gitCfgPath).toString());
        let dataMap = Object.keys(data).map((key) => [key, data[key]]);
        //console.log(dataMap)
        let url = dataMap.find(f => f[0].startsWith('remote'))[1].url;
        //console.log(dataMap)
        let m = url.match(/^\s*((https?:\/\/.+\/)|(.+\:))([^\/]+\/[^\.\s]+)(\.git)?\s*$/);

        //console.log(m);
        repository = m[4];
    }

    return repository;
}
