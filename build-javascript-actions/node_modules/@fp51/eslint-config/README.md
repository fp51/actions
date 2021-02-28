# @fp51/eslint-config

Opiniated eslint config based on airbnb config and prettier.

## Install

Add this dependency to your repository with its peer-dependency:

```bash
npm add --save-dev @fp51/eslint-config eslint
```
## Usage

Create a .eslintrc file in your project root with this content

```json
{
  "extends": [
    "@fp51/eslint-config",
    // or
    "@fp51/eslint-config/<special-config>"
  ]
}
```

### Which config ?

The package provide multiple configs whether you need simple javascript linting 
of full typescript + javascript + react linting with type-aware rules.

The details are here:

| config                                            | javascript | react | typescript | with types |
|---------------------------------------------------|:----------:|:-----:|:----------:|:----------:|
| @fp51/eslint-config/javascript             |     ✔️     |       |            |            |
| @fp51/eslint-config/javascript-react       |     ✔️     |  ✔️   |            |            |
| @fp51/eslint-config/light-typescript       |     ✔️     |       |     ✔️     |            |
| @fp51/eslint-config/light-typescript-react |     ✔️     |  ✔️   |     ✔️     |            |
| @fp51/eslint-config/typescript             |     ✔️     |       |     ✔️     |     ✔️     |
| @fp51/eslint-config/typescript-react       |     ✔️     |  ✔️   |     ✔️     |     ✔️     |

The `@fp51/eslint-config` links to `@fp51/eslint-config/typescript-react`.

Note that all configs can be used on JSON files too.

### Typescript

You will need to install a peer-dependency [`@typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser) 
as [it is required by `eslint-plugin-import`](https://github.com/benmosher/eslint-plugin-import#typescript)
internally.

We lint typescript files with @typescript-eslint/eslint-plugin that provide
rules that replace default eslint ones.

Some of these rules are
[type-aware](https://github.com/typescript-eslint/typescript-eslint/blob/3e06f0f0211549d7e5da5dfe73fbb521650ffc5d/docs/getting-started/linting/TYPED_LINTING.md) and  use `tsc` under the hood to compile each file before lint.

As this can drastically affect performance for big code base, we provide
`light-typescript` configs that do not use type-aware rules.

If you decide to give `@fp51/eslint-config/typescript` or
`@fp51/eslint-config/typescript-react` a try, you will need a
`tsconfig.json` file at the root of your project for type-aware rules to work.

Because we also lint JSON files, you need to include them like so:

```json
  "include": [
    "**/*",
    "**/*.json"
  ],
  "exclude": ["node_modules"]
```

It's probably better for you to define one special `.eslint.tsconfig.json` like
so: 

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": [
    "**/*",
    "**/*.json"
  ]
}
```

Then, in you `.eslintrc`

```json
  "parserOptions": {
    "project": "./.eslint.tsconfig.json"
  }
```


## Special eslint patch

The lib also provide a workaround for https://github.com/eslint/eslint/issues/3458

When needed, start by requiring the patch in your config entry point.

```js
require('@fp51/eslint-config/patch');

module.exports = {
  extends: [
    'eslint-config-airbnb-base',
    ...
```
