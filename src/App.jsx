import React from "react";
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
  NavLink,
} from "react-router-dom";
import Video from "./components/Video";
import Download from "./components/Download";
import Settings from "./components/Settings";
import "./App.scss";
import { remote } from "electron";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dir: localStorage.getItem("local"),
    };

    this.handleSelectDir = this.handleSelectDir.bind(this);
  }

  handleSelectDir() {
    const { dir } = this.state;
    const result = remote.dialog.showOpenDialogSync({
      defaultPath: dir || remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    const local = result[0];
    localStorage.setItem("local", local);
    this.setState({
      dir: local,
    });
  }

  render() {
    const { dir } = this.state;

    return (
      <div className="app">
        <Router>
          <div className="nav">
            <NavLink activeClassName="selected" to="/" exact>
              下载
            </NavLink>
            <NavLink activeClassName="selected" to="/video">
              视频
            </NavLink>
            <NavLink activeClassName="selected" to="/settings">
              设置
            </NavLink>
          </div>
          <div className="main-wrapper">
            <Switch>
              <Route path="/" exact>
                {dir ? <Download /> : <Redirect to="settings" />}
              </Route>
              <Route path="/video">
                {dir ? <Video /> : <Redirect to="settings" />}
              </Route>
              <Route path="/settings">
                <Settings dir={dir} handleSelectDir={this.handleSelectDir} />
              </Route>
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
