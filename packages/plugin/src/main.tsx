import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";

declare global {
  interface Window {
    ipcRenderer: import("electron").IpcRenderer;
  }
}

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
  if (import.meta.env.NODE_ENV === "production") {
    const { ipcRenderer } = await import("electron/renderer");
    window.ipcRenderer = ipcRenderer;
  }
  mount();
});
