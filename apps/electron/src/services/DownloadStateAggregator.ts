import { EventEmitter } from "node:events";
import { provide } from "@inversifyjs/binding-decorators";
import { DownloadStatus } from "@mediago/shared-common";
import { injectable } from "inversify";
import _ from "lodash";

export interface DownloadItemState {
  id: number;
  status: DownloadStatus;
  progress: number;
  isLive?: boolean;
  messages: string[];
  name?: string;
  speed?: string;
}

export interface DownloadState {
  [key: number]: DownloadItemState;
}

type DownloadStateListener = (state: DownloadState) => void;

@injectable()
@provide()
export default class DownloadStateAggregator {
  private readonly downloadState: DownloadState = {};

  private lastSentState: DownloadState = {};

  private readonly pendingUpdates = new Set<number>();

  private readonly emitter = new EventEmitter();

  private readonly THROTTLE_TIME = 300;

  private readonly PROGRESS_THRESHOLD = 1;

  private readonly sendStateUpdate: () => void;

  constructor() {
    this.sendStateUpdate = _.throttle(this.sendBatchStateUpdate.bind(this), this.THROTTLE_TIME);
  }

  onStateChange(listener: DownloadStateListener): () => void {
    this.emitter.on("state-change", listener);

    return () => {
      this.emitter.off("state-change", listener);
    };
  }

  updateState(id: number, updates: Partial<DownloadItemState>) {
    if (!this.downloadState[id]) {
      this.downloadState[id] = {
        id,
        status: DownloadStatus.Ready,
        progress: 0,
        messages: [],
      };
    }

    this.downloadState[id] = {
      ...this.downloadState[id],
      ...updates,
    };

    if (this.hasSignificantChange(id, updates)) {
      this.pendingUpdates.add(id);
      this.sendStateUpdate();
    }
  }

  appendMessage(id: number, message: string) {
    const messages = this.downloadState[id]?.messages ?? [];
    this.updateState(id, { messages: [...messages, message] });
  }

  cleanupState(id: number) {
    if (this.downloadState[id]) {
      delete this.downloadState[id];
      delete this.lastSentState[id];
      this.pendingUpdates.add(id);
      this.sendStateUpdate();
    }
  }

  getSnapshot(): DownloadState {
    return { ...this.downloadState };
  }

  private hasSignificantChange(id: number, updates: Partial<DownloadItemState>): boolean {
    const current = this.downloadState[id];
    const lastSent = this.lastSentState[id];

    if (updates.status !== undefined && updates.status !== current?.status) {
      return true;
    }

    if (updates.isLive !== undefined && updates.isLive !== current?.isLive) {
      return true;
    }

    if (updates.progress !== undefined && lastSent) {
      const progressDiff = Math.abs(updates.progress - (lastSent.progress || 0));
      if (progressDiff >= this.PROGRESS_THRESHOLD) {
        return true;
      }
    }

    if (updates.progress !== undefined && !lastSent) {
      return true;
    }

    if (updates.messages !== undefined) {
      const currentMsgCount = current?.messages?.length || 0;
      const newMsgCount = updates.messages.length;
      return newMsgCount > currentMsgCount;
    }

    return false;
  }

  private sendBatchStateUpdate() {
    if (this.pendingUpdates.size === 0) return;

    const updatedState: DownloadState = { ...this.downloadState };

    if (this.pendingUpdates.size > 0) {
      this.emitter.emit("state-change", updatedState);
      this.lastSentState = { ...updatedState };
    }

    this.pendingUpdates.clear();
  }
}
