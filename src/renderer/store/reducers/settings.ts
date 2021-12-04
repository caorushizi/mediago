import {
  SettingsUnionType,
  UPDATE_SETTINGS,
} from "../actions/settings.actions";
import { Settings } from "renderer/store/models/settings";

const initialState: Settings = {
  workspace: "",
  exeFile: "",
  tip: true,
  proxy: "",
  useProxy: false,
};

export default function settings(
  state = initialState,
  action: SettingsUnionType
): Settings {
  switch (action.type) {
    case UPDATE_SETTINGS:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
