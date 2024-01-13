import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";

const root = document.createElement("div");
root.id = "MediagoRoot";
document.body.appendChild(root);

export function mount() {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
