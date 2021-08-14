import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Route } from "react-router";
import Index from "./nodes/main";
import tdApp from "./utils/td";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import BrowserWindow from "renderer/nodes/browser";
import "./main.scss";
import store from "renderer/store";

console.log("window.require", window.require);

tdApp.init();

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Route path="/main" component={Index} />
      <Route path="/browser" component={BrowserWindow} />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
