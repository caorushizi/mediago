import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
  updateAvailable: boolean;
  updateChecking: boolean;
};

type Actions = {
  setUpdateAvailable: (available: boolean) => void;
  setUploadChecking: (loading: boolean) => void;
};

export type SessionStore = State & Actions;

export const useSessionStore = create<State & Actions>()(
  immer((set) => ({
    updateAvailable: false,
    updateChecking: true,
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
  })),
);
