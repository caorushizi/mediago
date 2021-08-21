import ReactDOM from "react-dom";
import React from "react";
import { HashRouter } from "react-router-dom";
import { Route, Switch, Redirect } from "react-router";
import tdApp from "./utils/td";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import BrowserPage from "./nodes/browser";
import MainPage from "./nodes/main";
import "./main.scss";
import store from "./store";

tdApp.init();

ReactDOM.render(
  <Provider store={store}>
    <HashRouter>
      <Switch>
        <Route path="/main" component={MainPage} />
        <Route path="/browser" component={BrowserPage} />
        <Redirect to={"/main"} />
      </Switch>
    </HashRouter>
  </Provider>,
  document.getElementById("root")
);
