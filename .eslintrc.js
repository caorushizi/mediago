const { join } = require("path");

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "airbnb",
    "airbnb/hooks",
    "prettier",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["prettier", "@typescript-eslint"],
  rules: {
    "prettier/prettier": "error",
    "react/jsx-filename-extension": [1, { extensions: [".tsx", ".ts"] }],
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
