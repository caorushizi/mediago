import {
  SettingsUnionType,
  UPDATE_SETTINGS,
} from "../actions/settings.actions";
import { Settings } from "renderer/store/models/settings";

export interface SettingsState {
  settings: Settings;
}

const initialState: SettingsState = {
  settings: {
    workspace: "",
    exeFile: "",
    tip: true,
    proxy: "",
    useProxy: false,
  },
};

export default function settings(
  state = initialState,
  action: SettingsUnionType
): SettingsState {
  switch (action.type) {
    case UPDATE_SETTINGS:
      return {
        settings: { ...state.settings, ...action.payload },
      };
    default:
      return state;
  }
}
