import ReactDOM from "react-dom";
import React from "react";
import "./index.scss";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import App from "./App";

initializeIcons();

ReactDOM.render(<App />, document.getElementById("root"));
