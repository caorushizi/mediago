import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
  updateAvailable: boolean;
  updateChecking: boolean;

  // theme
  theme: "light" | "dark";
};

type Actions = {
  setUpdateAvailable: (available: boolean) => void;
  setUploadChecking: (loading: boolean) => void;

  // theme
  setTheme: (theme: "light" | "dark") => void;
};

export const useSessionStore = create<State & Actions>()(
  immer((set) => ({
    updateAvailable: false,
    updateChecking: true,
    theme: "light",
    setUpdateAvailable: (available) => {
      set((state) => {
        state.updateAvailable = available;
      });
    },
    setUploadChecking: (loading) => {
      set((state) => {
        state.updateChecking = loading;
      });
    },
    setTheme: (theme) => {
      set((state) => {
        state.theme = theme;
      });
    },
  })),
);

export const themeSelector = (s: State & Actions) => ({
  theme: s.theme,
  setTheme: s.setTheme,
});

export const updateSelector = (s: State & Actions) => ({
  updateAvailable: s.updateAvailable,
  updateChecking: s.updateChecking,
  setUpdateAvailable: s.setUpdateAvailable,
  setUploadChecking: s.setUploadChecking,
});
