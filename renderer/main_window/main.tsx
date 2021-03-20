import * as ReactDOM from "react-dom";
import * as React from "react";
import "./index.scss";
import App from "./App";
import tdApp from "../renderer_common/td";
import "antd/dist/antd.css";

tdApp.init();

ReactDOM.render(<App />, document.getElementById("root"));
