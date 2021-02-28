module.exports = {
  plugins: ['prettier'],
  extends: ['prettier', 'plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        printWidth: 80,
        trailingComma: 'all',
        singleQuote: true,
      },
    ],
  },
};
