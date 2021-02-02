import ReactDOM from "react-dom";
import React from "react";
import "normalize.css/normalize.css";
import "./index.scss";
import App from "./App";

document.title = window.location.href;
window.onhashchange = () => {
  document.title = window.location.href;
};

ReactDOM.render(<App />, document.getElementById("root"));
