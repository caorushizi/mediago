import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./assets/common.scss";
import "antd/dist/antd.css";
import ErrorPage from "./pages/ErrorPage";
import Main from "./layout/Main";
import Download from "./pages/Download";
import Settings from "./pages/Settings";
import Browser from "./pages/Browser";

const router = createBrowserRouter([
  {
    path: "/",
    // path: "/test",
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Download />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    // path: "/",
    path: "browser",
    element: <Browser />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
