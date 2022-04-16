import { applyMiddleware, createStore } from "redux";
import { routerMiddleware } from "connected-react-router";
import { composeWithDevTools } from "redux-devtools-extension";
import { createHashHistory } from "history";
import createRootReducer from "./reducers";

export const history = createHashHistory();

const store = createStore(
  createRootReducer(history),
  composeWithDevTools(applyMiddleware(routerMiddleware(history)))
);

export default store;
