import { provide } from "@inversifyjs/binding-decorators";
import { type Controller, EnvPath, IPC } from "@mediago/shared-common";
import { handle } from "../core/decorators";
import { DownloaderServer } from "../services/downloader.server";
import { TYPES } from "../types/symbols";
import { type IpcMainEvent } from "electron";
import { inject, injectable } from "inversify";
import { exePath, workspace } from "../utils";
import ElectronUpdater from "../vendor/ElectronUpdater";
import BrowserWindow from "../windows/browser.window";
import MainWindow from "../windows/main.window";

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  private sharedState: Record<string, unknown> = {};

  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  @handle(IPC.app.getEnvPath)
  async getEnvPath(): Promise<EnvPath> {
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    const coreUrl = (await this.downloaderServer.getURL()) ?? "";
    return {
      binPath: exePath,
      dbPath: "",
      workspace: workspace,
      platform: process.platform,
      local: config.local,
      playerUrl: coreUrl ? `${coreUrl}/player/` : "",
      coreUrl,
    };
  }

  @handle(IPC.app.showBrowserWindow)
  async showBrowserWindow() {
    this.browserWindow.showWindow();
  }

  @handle(IPC.app.combineToHomePage)
  async combineToHomePage() {
    this.browserWindow.hideWindow();
    const client = this.downloaderServer.getClient();
    await client.setConfigKey("openInNewWindow", false);
  }

  @handle(IPC.app.getSharedState)
  async getSharedState() {
    return this.sharedState;
  }

  @handle(IPC.app.setSharedState)
  async setSharedState(event: IpcMainEvent, state: any) {
    this.sharedState = state;
  }

  @handle(IPC.app.getMachineId)
  async getMachineId(): Promise<string> {
    return "";
  }

  @handle(IPC.update.check)
  async checkUpdate() {
    this.updater.manualUpdate();
  }

  @handle(IPC.update.startDownload)
  async startUpdate() {
    this.updater.startDownload();
  }

  @handle(IPC.update.install)
  async installUpdate() {
    this.updater.install();
  }
}
