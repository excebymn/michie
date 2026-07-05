import create from 'zustand';
import { themeEngine } from '../engines/themeEngine';
import { colorEngine } from '../engines/colorEngine';

export type ColorMode = 'dark' | 'light' | 'system';
export type Motion = 'disabled' | 'normal' | 'smooth';
export type Transparency = 'off' | 'low' | 'medium' | 'high';
export type ColorSource = 'album-art';

const STORAGE_KEY = 'michie-appearance-settings';

interface AppearanceSettings {
  activeTheme: string;
  colorMode: ColorMode;
  colorSource: ColorSource;
  motion: Motion;
  transparency: Transparency;
}

const defaultSettings: AppearanceSettings = {
  activeTheme: 'liquid-glass',
  colorMode: 'system',
  colorSource: 'album-art',
  motion: 'normal',
  transparency: 'medium',
};

function loadSettings(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function persistSettings(settings: AppearanceSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function resolveColorMode(mode: ColorMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

interface AppearanceState extends AppearanceSettings {
  init: () => void;
  setTheme: (themeId: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setMotion: (motion: Motion) => void;
  setTransparency: (level: Transparency) => void;
  applyColorFromCover: (coverPath: string | null | undefined) => Promise<void>;
}

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  ...loadSettings(),

  init: () => {
    const s = get();
    themeEngine.applyTheme(s.activeTheme);
    themeEngine.applyColorMode(resolveColorMode(s.colorMode));
    themeEngine.applyMotion(s.motion);
    themeEngine.applyTransparency(s.transparency);
    colorEngine.reset(resolveColorMode(s.colorMode));
  },

  setTheme: (themeId) => {
    themeEngine.applyTheme(themeId);
    set({ activeTheme: themeId });
    persistSettings({ ...get(), activeTheme: themeId });
  },

  setColorMode: (mode) => {
    const resolved = resolveColorMode(mode);
    themeEngine.applyColorMode(resolved);
    set({ colorMode: mode });
    persistSettings({ ...get(), colorMode: mode });
    colorEngine.reset(resolved);
  },

  setMotion: (motion) => {
    themeEngine.applyMotion(motion);
    set({ motion });
    persistSettings({ ...get(), motion });
  },

  setTransparency: (level) => {
    themeEngine.applyTransparency(level);
    set({ transparency: level });
    persistSettings({ ...get(), transparency: level });
  },

  applyColorFromCover: async (coverPath) => {
    await colorEngine.applyFromCover(coverPath, resolveColorMode(get().colorMode));
  },
}));