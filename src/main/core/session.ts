import { session, Session } from "electron";
import { Sessions } from "main/utils/variables";

const sessionList = new Map<Sessions, Session>();

function createSession(partition: Sessions): void {
  sessionList.set(partition, session.fromPartition(partition));
}

export { sessionList, createSession };
