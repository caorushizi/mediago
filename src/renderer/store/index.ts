import { applyMiddleware, createStore } from "redux";
import createSagaMiddleware from "redux-saga";
import { routerMiddleware } from "connected-react-router";
import rootSaga from "./sagas";
import { composeWithDevTools } from "redux-devtools-extension";
import { createHashHistory } from "history";
import createRootReducer from "./reducers";

const sagaMiddleware = createSagaMiddleware();
export const history = createHashHistory();

const store = createStore(
  createRootReducer(history),
  composeWithDevTools(
    applyMiddleware(routerMiddleware(history), sagaMiddleware)
  )
);

sagaMiddleware.run(rootSaga);

export default store;
