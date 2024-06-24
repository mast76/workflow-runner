export function injectSystemEnv(str, localEnv) {
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
        if (val) {
            str = str.replace(s, val);
        }
    });
    //  console.log(str)
    return str;
}
