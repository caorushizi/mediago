/// <reference types="chrome" />

import { registerMessageRouter } from "./messages";
import { registerSniffer } from "./sniffer";

// MV3 service workers may be torn down and re-spawned at any time.
// All listeners must be registered synchronously at top level of every
// startup or Chrome will silently drop events.

registerSniffer();
registerMessageRouter();
