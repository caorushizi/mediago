import { useEffect } from "react";
import "./App.scss";
import logo from "./assets/logo.png";

function App() {
  useEffect(() => {}, []);
  return (
    <div className="app">
      <img className="app-logo" src={logo} alt="" />
    </div>
  );
}

export default App;
