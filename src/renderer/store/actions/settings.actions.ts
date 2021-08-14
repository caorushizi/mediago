import { Settings } from "renderer/store/models/settings";

export const UPDATE_SETTINGS = "UPDATE_SETTINGS";

export interface UpdateSettings {
  type: typeof UPDATE_SETTINGS;
  payload: Partial<Settings>;
}

export const updateSettings = (payload: Partial<Settings>): UpdateSettings => ({
  type: UPDATE_SETTINGS,
  payload,
});

export type SettingsUnionType = UpdateSettings;
