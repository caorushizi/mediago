import { makeAutoObservable } from "mobx";
import { SourceItem } from "types/common";
import { getVideos, insertVideo } from "renderer/common/scripts/localforge";

class AppStore {
  number = 0;

  tableData: SourceItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  add() {
    console.log("进入");
    this.number += 1;
  }

  async insertItem(item: SourceItem) {}

  async initTableData(page: number) {
    console.log("初始化表格数据");

    console.log(this.tableData);
  }
}

const appStore = new AppStore();

export { AppStore, appStore };
