import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyTheme,
  applyPalette,
  applyRawPalette,
  applyBackgroundColor,
  applyBackgroundImage,
  applyBackgroundPaletteRef,
} from '../services/appearanceService';
import { toAssetUrl } from '../utils/assetURL';

type BackgroundType = 'color' | 'image' | 'primary' | 'secondary';

interface AppearanceState {
  themeId: string;
  paletteId: string; // nama palette dari registry, atau 'album-tone'
  backgroundType: BackgroundType;
  backgroundValue: string; // hex kalau color, path lokal kalau image, diabaikan kalau primary/secondary
  setTheme: (id: string) => void;
  setPalette: (id: string) => void;
  setAlbumTonePalette: () => void;
  applyAlbumTone: (primaryHex: string, secondaryHex: string) => void;
  setBackgroundColor: (hex: string) => void;
  setBackgroundImage: (filePath: string) => void;
  setBackgroundPaletteRef: (which: 'primary' | 'secondary') => void;
  hydrate: () => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      themeId: 'glass',
      paletteId: 'sunset',
      backgroundType: 'color',
      backgroundValue: '#101010',

      setTheme: (id) => { applyTheme(id); set({ themeId: id }); },

      setPalette: (id) => {
        applyPalette(id);
        set({ paletteId: id });
      },

      // Mode khusus: warna diambil otomatis dari album art lagu yang sedang diputar
      setAlbumTonePalette: () => {
        set({ paletteId: 'album-tone' });
      },

      applyAlbumTone: (primaryHex, secondaryHex) => {
        applyRawPalette(primaryHex, secondaryHex);
      },

      setBackgroundColor: (hex) => {
        applyBackgroundColor(hex);
        set({ backgroundType: 'color', backgroundValue: hex });
      },

      setBackgroundImage: (filePath) => {
        applyBackgroundImage(toAssetUrl(filePath) ?? filePath);
        set({ backgroundType: 'image', backgroundValue: filePath });
      },

      setBackgroundPaletteRef: (which) => {
        applyBackgroundPaletteRef(which);
        set({ backgroundType: which });
      },

      // persist cuma nyimpen data, gak re-run side effect (link href/css var)
      // makanya perlu dipanggil manual sekali pas app start
      hydrate: () => {
        const { themeId, paletteId, backgroundType, backgroundValue } = get();
        applyTheme(themeId);

        // Kalau mode "ikut album art", biarkan efek di MainPlayer yang menerapkan
        // warna begitu currentSong ke-restore (supaya sinkron dengan lagu yang aktif).
        if (paletteId !== 'album-tone') {
          applyPalette(paletteId);
        }

        if (backgroundType === 'color') {
          applyBackgroundColor(backgroundValue);
        } else if (backgroundType === 'primary' || backgroundType === 'secondary') {
          applyBackgroundPaletteRef(backgroundType);
        } else {
          const asset = toAssetUrl(backgroundValue);
          if (asset) applyBackgroundImage(asset);
        }
      },
    }),
    { name: 'michie-appearance' }
  )
);