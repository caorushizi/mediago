import EventEmitter from "events";
import { injectable } from "inversify";

@injectable()
export default class HomeService extends EventEmitter {
  constructor() {
    super();
  }
}
