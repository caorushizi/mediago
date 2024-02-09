/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist"],
  parser: "@typescript-eslint/parser",
  plugins: [],
  rules: {},
};
