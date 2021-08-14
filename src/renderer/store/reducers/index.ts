import { combineReducers } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import settings, { SettingsState } from "./settings";

export interface AppState {
  router: RouterState;
  settings: SettingsState;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    settings,
  });
};

export default createRootReducer;
