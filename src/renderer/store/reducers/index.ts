import { combineReducers } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import settings, { OssState } from "./settings";

export interface AppState {
  router: RouterState;
  app: OssState;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    app: settings,
  });
};

export default createRootReducer;
