module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "react-app",
    "plugin:prettier/recommended",
  ],
  rules: {
    "@typescript-eslint/ban-ts-comment": "warn",
    "prettier/prettier": "error",
  },
};
