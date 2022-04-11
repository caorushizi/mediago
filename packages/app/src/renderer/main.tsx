import ReactDOM from "react-dom";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Route } from "react-router";
import tdApp from "./utils/td";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import BrowserPage from "./nodes/browser";
import MainPage from "./nodes/main";
import "./main.scss";
import store from "./store";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

Sentry.init({
  dsn: String(import.meta.env.VITE_APP_SENTRY_DSN || ""),
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

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
