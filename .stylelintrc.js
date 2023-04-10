module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-sass-guidelines',
    // 'stylelint-prettier/recommended',
    // Enforce a standard order for CSS properties
    // https://github.com/stormwarning/stylelint-config-recess-order
    "stylelint-config-prettier",
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-prettier'],
  customSyntax: 'postcss-scss',
  rules: {
    'prettier/prettier': true,
    'max-nesting-depth': null,
    'order/properties-alphabetical-order': null,
    'scss/operator-no-newline-after': null,
  },
};
