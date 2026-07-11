import { create } from "zustand";
import { invoke } from "../services/api";

export interface EqBand {
  frequency: number;
  gain_db: number;
}

const DEBOUNCE_MS = 60;

// Timer debounce disimpan di luar store (bukan di state Zustand) karena
// bukan data yang perlu memicu re-render - cuma housekeeping internal.
const debounceTimers: Record<number, ReturnType<typeof setTimeout>> = {};

interface EqualizerState {
  bands: EqBand[];
  enabled: boolean;
  loaded: boolean;
  fetchInitial: () => Promise<void>;
  setBandGain: (index: number, value: number) => void;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
}

// Sumber kebenaran TUNGGAL buat semua widget equalizer (Equalizer, EqualizerKnob,
// EqualizerHorizontal, EqualizerLed, EqualizerCurve - berapa pun instance yang
// dirender bersamaan). Sebelumnya tiap widget punya useState sendiri-sendiri
// yang fetch data pas mount masing-masing, jadi kalau widget A diubah,
// widget B nggak ikut ke-update karena state-nya emang beda objek.
// Dengan Zustand, semua komponen yang subscribe ke store ini otomatis
// re-render bareng begitu salah satu manggil setBandGain/setEnabled/reset.
export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  bands: [],
  enabled: true,
  loaded: false,

  fetchInitial: async () => {
    // Guard: kalau widget lain udah fetch & isi store duluan, jangan fetch
    // ulang - biar gak ada race dua invoke() barengan pas dua widget mount
    // bersamaan, dan biar widget yang mount belakangan langsung dapet
    // state yang sama persis (bukan versi awal dari DB lagi).
    if (get().loaded) return;

    const [bands, enabled] = await Promise.all([
      invoke<EqBand[]>("get_eq_bands"),
      invoke<boolean>("get_eq_enabled"),
    ]);

    set({
      bands: bands ?? [],
      enabled: typeof enabled === "boolean" ? enabled : true,
      loaded: true,
    });
  },

  setBandGain: (index, value) => {
    set((state) => {
      const bands = [...state.bands];
      bands[index] = { ...bands[index], gain_db: value };
      return { bands };
    });

    // Debounce commit ke backend biar gak nge-spam IPC channel tiap pixel
    // drag - UI (semua instance widget) tetep update langsung lewat set()
    // di atas, cuma pemanggilan invoke ke Rust yang ditunda.
    clearTimeout(debounceTimers[index]);
    debounceTimers[index] = setTimeout(() => {
      invoke("set_eq_band_gain", { band_index: index, gain_db: value });
    }, DEBOUNCE_MS);
  },

  setEnabled: (enabled) => {
    set({ enabled });
    invoke("set_eq_enabled", { enabled });
  },

  reset: () => {
    const count = get().bands.length;
    set((state) => ({
      bands: state.bands.map((b) => ({ ...b, gain_db: 0 })),
    }));
    for (let i = 0; i < count; i++) {
      clearTimeout(debounceTimers[i]);
      invoke("set_eq_band_gain", { band_index: i, gain_db: 0 });
    }
  },
}));