import Store from "electron-store";
import { workspace } from "./variables";

export default new Store({
  name: "config",
  cwd: workspace,
  fileExtension: "json",
  defaults: { local: "", exeFile: "" },
});
