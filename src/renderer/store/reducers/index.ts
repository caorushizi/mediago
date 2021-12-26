import { combineReducers } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import settings from "./settings";
import { Settings } from "renderer/store/models/settings";

export interface AppState {
  router: RouterState;
  settings: Settings;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    settings,
  });
};

export default createRootReducer;
