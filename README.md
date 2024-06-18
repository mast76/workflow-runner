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
- Env

## Missing (but within current scope)
- Uses
- With
- Concurrency
- ${{ variables }}

## Alternatives
ACT: https://github.com/nektos/act