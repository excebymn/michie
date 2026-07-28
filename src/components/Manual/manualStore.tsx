import create from "zustand";
import { manualSections } from "./manualContent";

interface ManualState {
  // Index section yang sedang dibuka. SENGAJA hidup di store terpisah, bukan
  // useState lokal di komponen — supaya progress TIDAK reset waktu
  // SettingsCenter ditutup, atau user pindah ke panel lain lalu balik lagi ke
  // Manual. Store ini tetap hidup selama app berjalan, yang di-unmount cuma
  // komponennya doang.
  activeIndex: number;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
}

const clamp = (index: number) =>
  Math.min(Math.max(index, 0), Math.max(manualSections.length - 1, 0));

export const useManualStore = create<ManualState>((set) => ({
  activeIndex: 0,
  goTo: (index) => set({ activeIndex: clamp(index) }),
  next: () => set((state) => ({ activeIndex: clamp(state.activeIndex + 1) })),
  previous: () =>
    set((state) => ({ activeIndex: clamp(state.activeIndex - 1) })),
}));