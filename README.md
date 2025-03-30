# Chot - Git checkout util script

## Information

This package combines `git checkout` and a `git pull` without the need to go through each repo individually. The script will look for projects that contains `.git` file and create a list of available repositories. From the CLI, you can choose in which repo you want to run those 2 commands.

### NOTE

If the repo doesn't have target branch, it will try to checkout main or master if any of the exists, and then run git pull.

## Installation

Run `npm install -g chot@latest`  
or  
Run `npx chot@latest <path>` (you can use . if you are already in the roor folder)
