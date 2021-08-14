import {
  SettingsUnionType,
  UPDATE_SETTINGS,
} from "../actions/settings.actions";
import { Executor, Settings } from "renderer/store/models/settings";

export interface OssState {
  settings: Settings;
}

const initialState: OssState = {
  settings: {
    workspace: "",
    executor: Executor.M3u8Down,
    warningTone: true,
    proxy: "",
  },
};

export default function settings(
  state = initialState,
  action: SettingsUnionType
): OssState {
  switch (action.type) {
    case UPDATE_SETTINGS:
      return {
        settings: { ...state.settings, ...action.payload },
      };
    default:
      return state;
  }
}
