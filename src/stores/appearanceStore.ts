import create from 'zustand';
import { toAssetUrl } from '../utils/assetURL';
import { palettes } from '../appearance/palettes';
import type { BackgroundMode, PanelMode } from '../appearance/types';

const STORAGE_KEY = 'michie-appearance-settings-v3';
const GLASS_LINK_ID = 'michie-glass-stylesheet';
const SOLID_LINK_ID = 'michie-solid-stylesheet';

interface AppearanceSettings {
  backgroundMode: BackgroundMode;
  backgroundColor: string;
  backgroundImagePath: string | null;
  paletteId: string;
  panelMode: PanelMode;
}

const defaultSettings: AppearanceSettings = {
  backgroundMode: 'color',
  backgroundColor: '#121212',
  backgroundImagePath: null,
  paletteId: palettes[0]?.id ?? 'default',
  panelMode: 'glass-solid',
};

function loadSettings(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function persist(settings: AppearanceSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyBackground(mode: BackgroundMode, color: string, imagePath: string | null) {
  const root = document.documentElement;
  if (mode === 'image' && imagePath) {
    const url = toAssetUrl(imagePath);
    root.style.setProperty('--michie-bg-image', url ? `url("${url}")` : 'none');
  } else {
    root.style.setProperty('--michie-bg-image', 'none');
  }
  root.style.setProperty('--michie-bg-color', color);
}

function applyPalette(paletteId: string) {
  const palette = palettes.find((p) => p.id === paletteId) ?? palettes[0];
  if (!palette) return;
  const root = document.documentElement;
  root.style.setProperty('--michie-primary', palette.primary);
  root.style.setProperty('--michie-secondary', palette.secondary);
}

function ensureLink(id: string): HTMLLinkElement {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return link;
}

// Ini bagian intinya: dua <link> independen, masing-masing diarahkan
// ke file asli atau ke empty.css tergantung mode yang dipilih.
function applyPanelMode(mode: PanelMode) {
  const glassLink = ensureLink(GLASS_LINK_ID);
  const solidLink = ensureLink(SOLID_LINK_ID);

  glassLink.href = mode === 'solid' ? '/appearance/empty.css' : '/appearance/glass.css';
  solidLink.href = mode === 'glass' ? '/appearance/empty.css' : '/appearance/solid.css';
}

interface AppearanceState extends AppearanceSettings {
  init: () => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (path: string) => void;
  clearBackgroundImage: () => void;
  setPalette: (paletteId: string) => void;
  setPanelMode: (mode: PanelMode) => void;
}

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  ...loadSettings(),

  init: () => {
    const s = get();
    applyBackground(s.backgroundMode, s.backgroundColor, s.backgroundImagePath);
    applyPalette(s.paletteId);
    applyPanelMode(s.panelMode);
  },

  setBackgroundColor: (color) => {
    set({ backgroundMode: 'color', backgroundColor: color });
    applyBackground('color', color, null);
    persist({ ...get(), backgroundMode: 'color', backgroundColor: color });
  },

  setBackgroundImage: (path) => {
    set({ backgroundMode: 'image', backgroundImagePath: path });
    applyBackground('image', get().backgroundColor, path);
    persist({ ...get(), backgroundMode: 'image', backgroundImagePath: path });
  },

  clearBackgroundImage: () => {
    set({ backgroundMode: 'color', backgroundImagePath: null });
    applyBackground('color', get().backgroundColor, null);
    persist({ ...get(), backgroundMode: 'color', backgroundImagePath: null });
  },

  setPalette: (paletteId) => {
    set({ paletteId });
    applyPalette(paletteId);
    persist({ ...get(), paletteId });
  },

  setPanelMode: (mode) => {
    set({ panelMode: mode });
    applyPanelMode(mode);
    persist({ ...get(), panelMode: mode });
  },
}));