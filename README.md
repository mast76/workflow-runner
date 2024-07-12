# Workflow Runner
Workflow Runner is an attempt to imitate GitHub Workflows on a local Windows Desktop.

Currently GitHub Workflows cannot be tested before they are commited and pushed to GitHub.
Workflow Runner tries to address this bad practice of commiting code (workflows) in an unkown state by allow at least some of it to be tested.

## Requirements
NodeJs, NPM, Powershell 7 (if pwsh is used by your workflows), Git (if bash is used by your workflows)

## Limitations
- Runs only on Windows
- Uses local PC as runner / no Docker containers
- Ignores jobs targeting other platforms than Windows
- Ignores deliberately stuff like 'on push' and 'on schedule' as it is not a part of the intended scope
- Ignores the 'jobs.<job_id>.environment','jobs.<job_id>.concurrency', and 'jobs.<job_id>.permissions'.
- Ignores anything container related.
- Uses the currently installed version NodeJs (ignores defined node-version in actions etc.)

## Warning 
:warning: When using action/checkout this action will delete the workspace before checking out. That includes the .git-folder and commited but unpushed changes within it.

## Status

### Implements
- Running of shell scripts in CMD, Powershell, and BASH
- Python (requires Python Launcer)
- Expressions, e.g. *${{ true || false == ( 1 < 2 ) }}*
- Enviroment context, e.g.  *${{ env.USERNAME }}* and *%USERNAME%*
- GitHub environment context partly, e.g. *${{ github.SERVER_URL}}* and *%GITHUB_SERVER_URL%* 
- Runner environment context partly, e.g. *${{ runner.TEMP }}* and *%RUNNER_TEMP%*
- Secrets context (encrypted file based)
- Vars context (file based)
- Inputs context
- Uses / actions (external repositoy)
- Uses / workflows (same repositoy)
- With
- Conditions (if)

### Missing (but within current scope)
- Uses / actions (same repositoy)
- Uses / workflows (external repositoy)
- Other environment contexts (e.g. needs, matrix)
- NPM package
- Functions (e.g. toJON(..))
- Error handling (e.g. 'jobs.<job_id>.strategy.fail-fast' and 'jobs.<job_id>.continue-on-error' )

### Thoughts
- Linux runner via WSL

## Building
```
    git clone https://github.com/mast76/workflow-runner.git
    npm install
    npx tsc
```

## Running
```
    node built\runwf.js <path-to-some-workflow-file> [<-sf | --secretsFile> path-to-secrets-file] [<-vf | --varsFile> path-to-vars-file]
```
*The workflow runner will use a tempory folder as the default workspace.*
### Vars file
Example of the file format (plain YAML)
```yaml
    MY_VAR: 'Some text'
```
### Secrets file
*The secrets file is similar to the vars file but values are expected to be encrypted with @tsmx/string-crypto*

Example of encrypting a value in NodeJs:
```js
    // 32 byte master secret - DO NOT USE THIS SECRET
    const ms = 'abcdefghijklmnopqrstuvxyzABCDEFG'
    // The secrect to encrypt
    const mySecret = 'hello world'
    require('@tsmx/string-crypto').encrypt(mySecret,ms)
```
*(Disable NodeJS history by setting NODE_REPL_HISTORY to an empty path before starting NodeJs, e.g. set NODE_REPL_HISTORY= )*

## Alternatives
ACT: https://github.com/nektos/act
