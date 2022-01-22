import { session, Session } from "electron";
import { Sessions } from "main/utils/variables";

const sessionList = new Map<Sessions, Session>();

sessionList.set(
  Sessions.PERSIST_MEDIAGO,
  session.fromPartition(Sessions.PERSIST_MEDIAGO)
);

export default sessionList;
