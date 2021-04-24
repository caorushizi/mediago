import Store from "electron-store";
import { workspace } from "./variables";

export default new Store({
  name: "config",
  cwd: workspace,
  fileExtension: "json",
  defaults: { workspace: "", exeFile: "N_m3u8DL-CLI", tip: true },
});
