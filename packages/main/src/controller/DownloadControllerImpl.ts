import { binDir } from "../utils/variables";
import { IpcMainInvokeEvent, Menu } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Controller, MainWindowService, RunnerService } from "../interfaces";
// import { downloader as mediaNode } from "downloader";
import { createDownloader, failFn, successFn } from "../utils";
import { handle, on } from "../decorator/ipc";

@injectable()
export default class DownloadControllerImpl implements Controller {
  constructor(
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.RunnerService)
    private readonly runner: RunnerService
  ) {}

  @on("open-download-item-context-menu")
  openDownloadItemContextMenu(e: IpcMainInvokeEvent, item: SourceItem): void {
    const menu = Menu.buildFromTemplate([
      {
        label: "详情",
        click: () => {
          e.sender.send("download-context-menu-detail", item);
        },
      },
      { type: "separator" },
      {
        label: "下载",
        click: () => {
          e.sender.send("download-context-menu-download", item);
        },
      },
      {
        label: "删除",
        click: () => {
          e.sender.send("download-context-menu-delete", item);
        },
      },
      { type: "separator" },
      {
        label: "清空列表",
        click: () => {
          e.sender.send("download-context-menu-clear-all");
        },
      },
    ]);
    menu.popup({
      window: this.mainWindow,
    });
  }

  @handle("exec-command")
  async execCommend(
    event: IpcMainInvokeEvent,
    exeFile: string,
    args: Record<string, string>
  ): Promise<any> {
    try {
      if (exeFile === "mediago") {
        // await mediaNode({
        //   name: args["name"],
        //   path: args["path"],
        //   url: args["url"],
        // });
        // return successFn("success");
      }
      const downloader = createDownloader(exeFile);
      // downloader.handle(this.runner);
      await downloader.parseArgs(args);
      const result = await this.runner.run({ cwd: binDir });
      return successFn(result);
    } catch (e: any) {
      return failFn(-1, e.message);
    }
  }
}
