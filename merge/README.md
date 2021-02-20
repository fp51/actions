Merge Action
======================================

This Github merge pull requests that are ready after a check_suite completed.

## Usage

```yaml
name: Merge PRs once ready

on: check_suite 

jobs:
  build:
    runs-on: ubuntu-18.04

    name: 'Merge PRs'

    steps:
      - uses: fp51/actions/merge@<version>
        if: github.event.action == 'completed'
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          pullNumber: 12
```

### Inputs

See [`action.yml`](./action.yml) for the list of action inputs.
