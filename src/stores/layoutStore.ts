import { create } from "zustand";
import { windowService } from "../services/windowService";

interface LayoutState {
  isMiniMode: boolean;
  toggleMiniMode: () => Promise<void>;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  isMiniMode: false,
  toggleMiniMode: async () => {
    const next = !get().isMiniMode;
    if (next) {
      await windowService.enterMiniMode();
    } else {
      await windowService.exitMiniMode();
    }
    set({ isMiniMode: next });
  },
}));