import { makeAutoObservable } from "mobx";

export default class AppStore {
  number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  add() {
    console.log("进入");
    this.number += 1;
  }
}
