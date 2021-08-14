import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Route } from "react-router";
import MainPage from "./nodes/main";
import tdApp from "./utils/td";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import BrowserPage from "renderer/nodes/browser";
import "./main.scss";
import store from "renderer/store";

tdApp.init();

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Route path="/main" component={MainPage} />
      <Route path="/browser" component={BrowserPage} />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
