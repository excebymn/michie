import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme, applyPalette, applyBackgroundColor, applyBackgroundImage } from '../services/appearanceService';
import { toAssetUrl } from '../utils/assetURL'; // wrapper convertFileSrc yang udah ada

type BackgroundType = 'color' | 'image';

interface AppearanceState {
  themeId: string;
  paletteId: string;
  backgroundType: BackgroundType;
  backgroundValue: string; // hex kalau color, path lokal kalau image
  setTheme: (id: string) => void;
  setPalette: (id: string) => void;
  setBackgroundColor: (hex: string) => void;
  setBackgroundImage: (filePath: string) => void;
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
      setPalette: (id) => { applyPalette(id); set({ paletteId: id }); },
      setBackgroundColor: (hex) => {
        applyBackgroundColor(hex);
        set({ backgroundType: 'color', backgroundValue: hex });
      },
      setBackgroundImage: (filePath) => {
        // toAssetUrl may return null; fall back to original path
        applyBackgroundImage(toAssetUrl(filePath) ?? filePath);
        set({ backgroundType: 'image', backgroundValue: filePath });
      },
      // persist cuma nyimpen data, gak re-run side effect (link href/css var)
      // makanya perlu dipanggil manual sekali pas app start
      hydrate: () => {
        const { themeId, paletteId, backgroundType, backgroundValue } = get();
        applyTheme(themeId);
        applyPalette(paletteId);
        backgroundType === 'color'
          ? applyBackgroundColor(backgroundValue)
          : (() => {
              const asset = toAssetUrl(backgroundValue);
              if (asset) applyBackgroundImage(asset);
            })();
      },
    }),
    { name: 'michie-appearance' }
  )
);