# Workflow Runner
Workflow Runner is an attempt to imitate GitHub Workflows on a local Windows Desktop.

Currently GitHub Workflows cannot be tested before they are commited and pushed to GitHub.
Workflow Runner tries to address this bad practice of commiting code (workflows) in an unkown state by allow at least some of it to be tested.

## Requirements
NodeJs, NPM, Powershell 7 (if pwsh is used by your workflows), Git (if bash is used by your workflows)

## Limitations
- Runs only on Windows
- Uses local PC as runner / no Docker
- Ignores jobs targeting other platforms than Windows
- Ignores deliberately stuff like 'on push' and 'on schedule' as it is not a part of the intended scope

## Warning 
:warning: When using action/checkout this action will delete the workspace before checking out. That includes the .git-folder and commited but unpushed changes within it.

## Status

### Implements
- Running of shell scripts in CMD, Powershell, and BASH
- Expressions, e.g. *${{ true || false == ( 1 < 2 ) }}*
- Enviroment context, e.g.  *${{ env.USERNAME }}* and *%USERNAME%*
- GitHub environment context partly, e.g. *${{ github.SERVER_URL}}* and *%GITHUB_SERVER_URL%* 
- Runner environment context partly, e.g. *${{ runner.TEMP }}* and *%RUNNER_TEMP%*
- Secrets context (encrypted file based)
- Vars context (file based)
- Uses / actions
- With
- Conditions (if)

### Missing (but within current scope)
- Other environment contexts
- Python
- Reusable workflows
- NPM package

### Thoughts
- Linux runner via WSL

## Building
```pwsh
    git clone https://github.com/mast76/workflow-runner.git
    npm install
    npx tsc
```

## Running
```pwsh
    node built\runwf.js <path to some workflow file>
```

## Alternatives
ACT: https://github.com/nektos/act
