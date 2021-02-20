Create `gh-pages` branch
======================================

Create the `gh-pages` branch if needed

## Usage

The Github Workflow to use this action looks like this : 

```yaml
name: Hello world

on: push

jobs:
  build:
    runs-on: ubuntu-latest

    name: 'Find pull request for branch'

    steps:
      - uses: fp51/actions/create-gh-pages-branch@<version>
```
