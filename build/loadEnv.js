const dotenvExpand = require("dotenv-expand");
const path = require("path");
const dotenv = require("dotenv");

module.exports = function loadEnv() {
  const mode = process.env.NODE_ENV;
  const basePath = path.resolve(__dirname, `../.env${mode ? `.${mode}` : ``}`);

  const load = (envPath) => {
    try {
      const env = dotenv.config({
        path: envPath,
        debug: process.env.DEBUG,
      });
      dotenvExpand(env);
    } catch (err) {}
  };

  load(basePath);
};
