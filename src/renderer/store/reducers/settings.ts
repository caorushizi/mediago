import {
  Settings,
  SettingsUnionType,
  UPDATE_SETTINGS,
} from "../actions/settings.actions";

const initialState: Settings = {
  workspace: "",
  exeFile: "",
  tip: true,
  proxy: "",
  useProxy: false,
  statistics: true,
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
