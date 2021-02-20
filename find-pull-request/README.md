Find pull request Action
======================================

Find a pull request for a branch.

## Usage

The Github Workflow to use this action looks like this : 

```yaml
name: Hello world

on: push

jobs:
  build:
    runs-on: ubuntu-18.04

    name: 'Find pull request for branch'

    steps:
      - uses: fp51/actions/find-pull-request@<version>
        id: pr
        with:
          branch: ${{ github.event.ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - run: |
          echo "pull request found : $pullExists"
          echo "pull request number : $pullNumber"
        env:
          pullExists: ${{ steps.pr.outputs.pullExists }}
          pullExists: ${{ steps.pr.outputs.pullNumber }}
```

### Inputs

See [`action.yml`](./action.yml) for the list of action inputs.


### Outpus

The action create two outputs: 

- `pullExists` (`"true"` if pull request found, `"false"` otherwise)
- `pullNumber` (`"-1"` if not found, `"<number>"` otherwise)
