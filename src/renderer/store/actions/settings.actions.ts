export interface Settings {
  workspace: string;
  tip: boolean;
  proxy: string;
  useProxy: boolean;
  exeFile: string;
}

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
