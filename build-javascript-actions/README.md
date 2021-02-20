Build Javascript Github Actions Action
======================================

This Github action build Github actions stored in a monorepo.

## Why ?

Let's say you have a repository that contains actions. ie. a monorepo of actions : 

```
.
├── .git/
│   └── ...
├── .github/
│   └── ...
├── action1
│   ├── .gitignore
│   ├── src/
│   │   └── ...
│   ├── package.json
│   └── action.yml
├── action2
│   ├── .gitignore
│   ├── src/
│   │   └── ...
│   ├── package.json
│   └── action.yml
└─── ...
```

Some of your actions are [Javascript actions](https://help.github.com/en/articles/about-actions#types-of-actions).
Because they need to be pushed with their `node_modules` and build files, you want to build a specific workflow : 

1. Javascript actions lives on `main` without `node_modules` and build `files`. They hide them with their `.gitignore`.

2. When something is merged on main a workflow is in charge of building them on the `release` branch. It will remove
   `node_modules` and transpiled code from each action `.gitignore`, install, build, `git add`, and push.

3. To version a release. You create a [Github release](https://help.github.com/en/articles/creating-releases) based on the
   `release` branch (and not `main`, that's the trick)

4. You then use the new action with `uses: owner/monorepo-of-actions/<action>@<version>` where `<version>` is the
   tag of the last release.

## Usage

The Github Workflow to use this action looks like this : 

```yaml
name: Build actions on release branch

on:
  push:
    branches:
    - main

jobs:
  build:
    runs-on: ubuntu-18.04

    name: 'Build Javascript actions'

    steps:
      - name: 'Checkout directory'
        uses: actions/checkout@v1

      - name: 'Init Git name'
        run: |
          git config --global user.name "A name"
          git config --global user.email "email@example.com"

      - name: 'Checkout release branch'
        run: git checkout release

      - name: 'Merge main on release'
        run : git merge main --ff

      - name: 'Build Javascript actions'
        uses: fp51/actions/build-javascript-actions@<version>
        with:
          build_directory: 'lib'

      - name: 'Commit and push'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          if [ ! -n "$(git status --porcelain)" ]; then
            echo "Nothing to commit. Done.";
            exit 0;
          fi

          authenticatedUrl="https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git"
          git remote set-url origin $authenticatedUrl

          git add .
          git commit -m "Javascript actions are built"

          git push
```

The `fp51/actions/build-javascript-actions` action will go in each Javascript
action to remove `node_modules` and `<build_directory>` lines in the local
`.gitignore`, install and build if necessary.

### Inputs

See [`action.yml`](./action.yml) for the list of action inputs.
