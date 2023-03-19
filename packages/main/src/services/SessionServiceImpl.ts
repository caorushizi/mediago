import { session, type Session } from "electron";
import { injectable } from "inversify";
import { PERSIST_MEDIAGO } from "../helper/variables";
import { type SessionService } from "../interfaces";

@injectable()
export default class SessionServiceImpl implements SessionService {
  partition = PERSIST_MEDIAGO;
  session: Session;

  constructor() {
    this.session = session.fromPartition(this.partition);
  }

  get(): Session {
    return this.session;
  }
}
