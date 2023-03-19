import React, { FC } from "react";
import { Outlet } from "react-router-dom";
import "./App.scss";

const App: FC = () => {
  return (
    <div className="container">
      <Outlet />
    </div>
  );
};

export default App;
