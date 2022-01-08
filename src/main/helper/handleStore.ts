import Store from "electron-store";
import { workspace } from "main/utils/variables";

export default function handleStore(): void {
  let exeFile = "";
  if (process.platform === "win32") {
    exeFile = "N_m3u8DL-CLI";
  } else {
    exeFile = "mediago";
  }

  global.store = new Store<AppStore>({
    name: "config",
    cwd: workspace,
    fileExtension: "json",
    watch: true,
    defaults: {
      workspace: "",
      exeFile,
      tip: true,
      proxy: "",
      useProxy: false,
    },
  });
}
