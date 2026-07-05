import { getColorSync } from 'colorthief';
import { toAssetUrl } from '../utils/assetURL';

interface HSL { h: number; s: number; l: number; }

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToCss({ h, s, l }: HSL) {
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Dark Engine: background/surface digelapkan, warna dominan jadi aksen
function darkEngineAdjust(base: HSL) {
  return {
    accent: { h: base.h, s: clamp(base.s, 35, 75), l: clamp(base.l, 45, 65) },
    background: { h: base.h, s: clamp(base.s * 0.4, 10, 30), l: 8 },
    surface: { h: base.h, s: clamp(base.s * 0.4, 10, 30), l: 14 },
    onSurface: { h: base.h, s: 5, l: 95 },
    border: { h: base.h, s: clamp(base.s * 0.3, 5, 20), l: 24 },
  };
}

// Light Engine: background diterangkan, saturation warna dominan diredam
function lightEngineAdjust(base: HSL) {
  return {
    accent: { h: base.h, s: clamp(base.s, 35, 70), l: clamp(base.l, 35, 50) },
    background: { h: base.h, s: clamp(base.s * 0.2, 5, 15), l: 97 },
    surface: { h: base.h, s: clamp(base.s * 0.2, 5, 15), l: 100 },
    onSurface: { h: base.h, s: 10, l: 12 },
    border: { h: base.h, s: clamp(base.s * 0.2, 5, 15), l: 88 },
  };
}

function applyVariables(vars: Record<string, HSL>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(`--michie-${key}`, hslToCss(value));
  }
}

async function loadImageSameOrigin(path: string): Promise<HTMLImageElement> {
  const assetUrl = toAssetUrl(path);
  if (!assetUrl) throw new Error('Invalid image path');

  const response = await fetch(assetUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const revoke = () => URL.revokeObjectURL(objectUrl);
    img.onload = () => {
      revoke();
      resolve(img);
    };
    img.onerror = (err) => {
      revoke();
      reject(err);
    };
    img.src = objectUrl;
  });
}

export const colorEngine = {
  applyFromCover: async (coverPath: string | null | undefined, mode: 'dark' | 'light') => {
    console.log('[Color Engine] applyFromCover', { coverPath, mode });
    if (!coverPath) {
      colorEngine.reset(mode);
      return;
    }
    try {
      const img = await loadImageSameOrigin(coverPath);
      const color = getColorSync(img) as [number, number, number] | null;
      if (!color) throw new Error('Unable to extract color');
      const [r, g, b] = color;
      const base = rgbToHsl(r, g, b);
      applyVariables(mode === 'dark' ? darkEngineAdjust(base) : lightEngineAdjust(base));
    } catch (err) {
      console.warn('[Color Engine] gagal ekstrak warna dari cover, pakai default:', coverPath, err);
      colorEngine.reset(mode);
    }
  },

  reset: (mode: 'dark' | 'light') => {
    const neutral: HSL = { h: 260, s: 15, l: 50 };
    applyVariables(mode === 'dark' ? darkEngineAdjust(neutral) : lightEngineAdjust(neutral));
  },
};