const { join } = require("path");

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "react/jsx-filename-extension": [1, { extensions: [".tsx", ".ts"] }],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "@typescript-eslint/no-empty-interface": 0,
    "@typescript-eslint/naming-convention": 0,
    "@typescript-eslint/no-misused-promises": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "no-underscore-dangle": 0,
  },
  settings: {
    "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
    "import/core-modules": ["electron"],
    "import/resolver": {
      node: {
        paths: ["main", "renderer", "types"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      webpack: {
        config: join(__dirname, "webpack.config.js"),
      },
    },
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
};
