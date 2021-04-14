import * as ReactDOM from "react-dom";
import * as React from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import App from "./App";
import tdApp from "../common/scripts/td";
import "antd/dist/antd.css";
import AppStore from "./store";

tdApp.init();

const store = new AppStore();

const TestComp = observer(({ store: useStore }: { store: AppStore }) => (
  <App store={toJS<AppStore>(useStore)} />
));

ReactDOM.render(<TestComp store={store} />, document.getElementById("root"));
