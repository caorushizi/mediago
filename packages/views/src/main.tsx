import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Route } from "react-router";
import { tdApp } from "./utils/talkingdata";
import "antd/dist/reset.css";
import { Provider } from "react-redux";
import BrowserPage from "./nodes/browser";
import MainPage from "./nodes/main";
import "./main.scss";
import store from "./store";

tdApp.init();

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Route path="/main" component={MainPage} />
      <Route path="/browser" component={BrowserPage} />
    </Router>
  </Provider>,
  document.getElementById("root")
);
