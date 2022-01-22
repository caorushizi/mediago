import { windowManager } from "main/core/window";
import { Windows } from "main/utils/variables";
import createBrowserView from "main/core/browserView";

export default async function handleWindows(): Promise<void> {
  await Promise.all([
    windowManager.create(Windows.MAIN_WINDOW),
    await windowManager.create(Windows.BROWSER_WINDOW),
  ]);
  await createBrowserView();
}
