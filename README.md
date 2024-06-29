# Workflow Runner
Workflow Runner is an attempt to imitate GitHub Workflows on a local Windows Desktop.

Currently GitHub Workflows cannot be tested before they are commited and pushed to GitHub.
Workflow Runner tries to address this bad practice of commiting code (workflows) in an unkown state by allow at least some of it to be tested.

## Requirements
NodeJs, NPM, Powershell 7 (if pwsh is used by your workflows), WSL (if bash is used by your workflows)

## Limitations
- Runs only on Windows
- Uses local PC as runner
- Ignores jobs targeting other platforms than Windows
- Ignores deliberately stuff like 'on push' and 'on schedule' as it is not a part of the intended scope

## Status
Currently written in JavaScript planed to be rewritten in Typescript.

### Implements
- Running of shell scripts in CMD, Powershell, and BASH
- Expressions, e.g. *${{ true || false == ( 1 < 2 ) }}*
- Enviroment context, e.g.  *${{ env.USERNAME }}* and *%USERNAME%*
- GitHub environment context partly, e.g. *${{ github.SERVER_URL}}* and *%GITHUB_SERVER_URL%* 
- Runner environment context partly, e.g. *${{runner.TEMP}}* and *%RUNNER_TEMP%*

## Missing (but within current scope)
- Uses / actions
- With
- Concurrency
- Conditions (if)
- Secrets and other environment contexts
- Python
- Reusable workflows

## Alternatives
ACT: https://github.com/nektos/act
