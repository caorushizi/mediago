import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Route } from "react-router";
import tdApp from "./utils/td";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import BrowserPage from "./nodes/browser";
import TerminalPage from "./nodes/terminal";
import MainPage from "./nodes/main";
import "./main.scss";
import store from "./store";

tdApp.init();

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Route path="/main" component={MainPage} />
      <Route path="/browser" component={BrowserPage} />
      <Route path="/terminal" component={TerminalPage} />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
