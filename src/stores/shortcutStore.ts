import create from "zustand";
import { shortcutsRegistry } from "../config/shortcutsRegistry";

const STORAGE_KEY = "michie-shortcuts";

function loadOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// Gabungkan default registry + override user -> peta id -> combo yang lagi aktif.
// Shortcut yang customizable:false selalu pakai defaultCombo, gak pernah baca override
// (jaga-jaga kalau ada localStorage lama/corrupt yang somehow punya entry buat id itu).
function buildKeymap(overrides: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const def of shortcutsRegistry) {
    map[def.id] =
      def.customizable && overrides[def.id] ? overrides[def.id] : def.defaultCombo;
  }
  return map;
}

interface SetShortcutResult {
  ok: boolean;
  conflictWith?: string; // label shortcut lain yang udah pakai combo yang sama
}

interface ShortcutsState {
  keymap: Record<string, string>;
  // true selama panel Shortcuts lagi "merekam" kombinasi baru — dipakai MainPlayer
  // buat suppress global listener supaya tombol yang lagi direkam gak ke-trigger dobel
  isCapturing: boolean;
  setCapturing: (value: boolean) => void;
  setShortcut: (id: string, combo: string) => SetShortcutResult;
  resetShortcut: (id: string) => void;
  resetAll: () => void;
  findActionForCombo: (combo: string) => string | null;
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  keymap: buildKeymap(loadOverrides()),
  isCapturing: false,

  setCapturing: (value: boolean) => set({ isCapturing: value }),

  setShortcut: (id: string, combo: string) => {
    const def = shortcutsRegistry.find((d) => d.id === id);
    if (!def || !def.customizable) return { ok: false };

    const conflictDef = shortcutsRegistry.find(
      (d) => d.id !== id && get().keymap[d.id] === combo,
    );
    if (conflictDef) return { ok: false, conflictWith: conflictDef.label };

    const overrides = loadOverrides();
    overrides[id] = combo;
    saveOverrides(overrides);
    set({ keymap: buildKeymap(overrides) });
    return { ok: true };
  },

  resetShortcut: (id: string) => {
    const overrides = loadOverrides();
    delete overrides[id];
    saveOverrides(overrides);
    set({ keymap: buildKeymap(overrides) });
  },

  resetAll: () => {
    saveOverrides({});
    set({ keymap: buildKeymap({}) });
  },

  findActionForCombo: (combo: string) => {
    const entry = Object.entries(get().keymap).find(([, c]) => c === combo);
    return entry ? entry[0] : null;
  },
}));