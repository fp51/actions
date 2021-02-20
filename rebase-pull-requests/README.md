Rebase Pull Requests Action
======================================

This Github action rebase pull requests.

## Usage

```yaml
name: Rebase pull requests push on main

on: 
  push:
    branches:
    - main

jobs:
  build:
    runs-on: ubuntu-18.04

    name: 'Rebase branch on main'

    steps:
      - uses: actions/checkout@v1

      - uses: fp51/actions/rebase-pull-requests@<version>
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

See [`action.yml`](./action.yml) for the list of action inputs.
