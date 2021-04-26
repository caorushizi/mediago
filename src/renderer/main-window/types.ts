import * as React from "react";

export interface AppContext {
  exeFile: string;
  workspace: string;
}

export const AppStateContext = React.createContext<AppContext>({
  exeFile: "",
  workspace: "",
});
