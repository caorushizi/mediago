import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";

export function mount() {
  const root = document.createElement("div");
  root.id = "MediagoRoot";
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  mount();
});
