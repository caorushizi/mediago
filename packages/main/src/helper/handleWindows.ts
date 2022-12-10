import { windowManager } from "../core/window";
import { Windows } from "../utils/variables";
import createBrowserView from "../core/browser";

export default async function handleWindows(): Promise<void> {
  await Promise.all([
    windowManager.create(Windows.MAIN_WINDOW),
    await windowManager.create(Windows.BROWSER_WINDOW),
  ]);
  await createBrowserView();
}
