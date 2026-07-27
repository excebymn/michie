import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WindowModeState {
  compactMode: boolean;
  toggleCompactMode: () => void;
  setCompactMode: (v: boolean) => void;

  // Mini Player — window kecil terpisah yang mengambang. Ini BARU flag
  // UI-nya, belum ada logic window sungguhan. Implementasi lanjutan
  // tinggal:
  //   1. Rust: command baru `open_mini_player` yang bikin WebviewWindow
  //      baru (label 'mini', ukuran kecil misal 300x120, always_on_top,
  //      resizable:false), + `close_mini_player`.
  //   2. Frontend: effect (taruh di App.tsx atau di sini) yang subscribe
  //      ke `miniPlayerMode`, invoke command Rust itu tiap berubah, dan
  //      hide/minimize window utama barengan (appWindow.hide()) saat aktif,
  //      show lagi saat dimatikan.
  // Semua UI/tombol/store sudah siap, cuma "isi tengahnya" yang nanti
  // diisi — itu maksud dari "gampang diimplementasikan nanti".
  miniPlayerMode: boolean;
  toggleMiniPlayerMode: () => void;
}

export const useWindowModeStore = create<WindowModeState>()(
  persist(
    (set, get) => ({
      compactMode: false,
      toggleCompactMode: () => set({ compactMode: !get().compactMode }),
      setCompactMode: (v) => set({ compactMode: v }),

      miniPlayerMode: false,
      toggleMiniPlayerMode: () => set({ miniPlayerMode: !get().miniPlayerMode }),
    }),
    { name: "michie-window-mode" },
  ),
);