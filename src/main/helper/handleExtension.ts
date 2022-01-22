import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import logger from "main/core/logger";

export default async function handleExtension(): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    try {
      await installExtension(REACT_DEVELOPER_TOOLS);
      await installExtension(REDUX_DEVTOOLS);
    } catch (e) {
      logger.info(e);
    }
  }
}
