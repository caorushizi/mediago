import "@/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { applySystemTheme } from "@/lib/theme";
import { App } from "./App";

applySystemTheme();

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
    <Toaster richColors position="top-center" duration={2400} />
  </React.StrictMode>,
);
