import path from "path";
import Store from "electron-store";
import variables from "./variables";

export default new Store({
  name: variables.appName,
  cwd: path.join(variables.appData, variables.appName),
  fileExtension: "json",
  defaults: { local: "", exeFile: "" },
});
