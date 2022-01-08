import windowManager from "main/window/windowManager";
import { Windows } from "main/variables";
import createBrowserView from "main/browserView";

export default async function handleWindows(
  webviewSession: Electron.Session
): Promise<void> {
  await Promise.all([
    windowManager.create(Windows.MAIN_WINDOW),
    await windowManager.create(Windows.BROWSER_WINDOW),
  ]);
  await createBrowserView(webviewSession);
}
