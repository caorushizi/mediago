import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_CONVERSION,
  type Controller,
  type ConversionPagination,
  DELETE_CONVERSION,
  GET_CONVERSIONS,
} from "@mediago/shared-common";
import { DownloaderServer, handle, TYPES } from "@mediago/shared-node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";

@injectable()
@provide(TYPES.Controller)
export default class ConversionController implements Controller {
  constructor(
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  @handle(GET_CONVERSIONS)
  async getConversions(_e: IpcMainEvent, pagination: ConversionPagination) {
    const client = this.downloaderServer.getClient();
    const res = await client.getConversions({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
    return res.data;
  }

  @handle(ADD_CONVERSION)
  async addConversion(
    _e: IpcMainEvent,
    conversion: { name?: string; path: string },
  ) {
    const client = this.downloaderServer.getClient();
    const res = await client.addConversion(conversion);
    return res.data;
  }

  @handle(DELETE_CONVERSION)
  async deleteConversion(_e: IpcMainEvent, id: number) {
    const client = this.downloaderServer.getClient();
    await client.deleteConversion(id);
  }
}
