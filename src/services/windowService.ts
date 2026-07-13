// windowService.ts
// Wrapper tipis di atas Tauri window API (bukan invoke() — ini murni kontrol
// window frontend, jadi disengaja dipisah dari services/ yang biasanya 1:1
// sama command backend).
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

const MINI_SIZE = { width: 320, height: 320 };

// Diisi sebelum masuk mini mode, dipakai buat balikin ukuran window user
// yang sebenarnya (bukan hardcoded default) pas keluar dari mini mode.
let savedSize: { width: number; height: number } | null = null;

export const windowService = {
  async enterMiniMode() {
    const win = getCurrentWindow();
    try {
      const current = await win.innerSize();
      const scale = await win.scaleFactor();
      const logical = current.toLogical(scale);
      savedSize = { width: logical.width, height: logical.height };

      // Urutan penting: kunci ukuran (min=max) DULU sebelum resize, supaya
      // WM auto-tiling (niri, sway, i3, dst) yang mendeteksi "fixed size
      // window = float" langsung ngenalin window ini sebagai floating sejak
      // awal transisi, bukan telat satu frame.
      await win.setMinSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height));
      await win.setMaxSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height));
      await win.setResizable(false);
      await win.setSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height));
    } catch (e) {
      console.error("[windowService] Gagal masuk mini mode:", e);
    }
  },

  async exitMiniMode() {
    const win = getCurrentWindow();
    try {
      await win.setResizable(true);
      await win.setMinSize(null);
      await win.setMaxSize(null);
      const target = savedSize ?? { width: 1450, height: 1000 };
      await win.setSize(new LogicalSize(target.width, target.height));
    } catch (e) {
      console.error("[windowService] Gagal keluar mini mode:", e);
    }
  },
};