import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LightModeState {
  isLightMode: boolean;
  setLightMode: (value: boolean) => void;
  toggleLightMode: () => void;
}

export const useLightModeStore = create<LightModeState>()(
  persist(
    (set, get) => ({
      isLightMode: false,
      setLightMode: (value) => set({ isLightMode: value }),
      toggleLightMode: () => set({ isLightMode: !get().isLightMode }),
    }),
    { name: 'michie-light-mode' }
  )
);