import { createRoot } from "react-dom/client";
import React from "react";
import "./main.scss";
import App from "./App";

// 清除现有的 HTML 内容
// 创建一个新的div元素
const rootDiv = document.createElement("div");
rootDiv.id = "root";
document.body.appendChild(rootDiv);
const root = createRoot(rootDiv);
root.render(<App />);
