import { CombinedState, combineReducers, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import settings from "./settings";
import main from "./main";
import browser from "./browser";
import { Settings } from "../actions/settings.actions";
import { MainState } from "../actions/main.actions";
import { BrowserState } from "../actions/browser.actions";

export interface AppState {
  router: RouterState;
  settings: Settings;
  main: MainState;
  browser: BrowserState;
}

const createRootReducer = (
  history: History
): Reducer<CombinedState<AppState>> => {
  return combineReducers({
    router: connectRouter(history),
    settings,
    main,
    browser,
  });
};

export default createRootReducer;
