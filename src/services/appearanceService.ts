import { invoke } from "./api";
import { themeRegistry } from "../config/themeRegistry";
import { paletteRegistry } from "../config/paletteRegistry";

const THEME_LINK_ID = "app-theme-stylesheet";

function getOrCreateThemeLink(): HTMLLinkElement {
  let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  return link;
}

export function applyTheme(themeId: string) {
  const theme = themeRegistry.find((t) => t.id === themeId);
  if (!theme) return;
  getOrCreateThemeLink().href = theme.cssUrl;
}

export function applyPalette(paletteId: string) {
  const palette = paletteRegistry.find((p) => p.id === paletteId);
  if (!palette) return;
  applyRawPalette(palette.primary, palette.secondary);
}

// Terapkan warna primary/secondary langsung (dipakai palette manual maupun mode tone album art)
export function applyRawPalette(primary: string, secondary: string) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-secondary", secondary);
}

export function applyBackgroundColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--app-background", hex);
  root.style.setProperty("--app-background-image", "none");
  pulseBackground();
}

// Background yang mengikuti warna primary/secondary palette aktif secara LIVE.
// Pakai var() supaya otomatis re-resolve tiap ganti palette, tanpa perlu re-apply manual.
export function applyBackgroundPaletteRef(which: "primary" | "secondary") {
  const root = document.documentElement;
  root.style.setProperty("--app-background", `var(--color-${which})`);
  root.style.setProperty("--app-background-image", "none");
  pulseBackground();
}

export function applyBackgroundImage(assetUrl: string) {
  document.documentElement.style.setProperty(
    "--app-background-image",
    `url("${assetUrl}")`,
  );
  pulseBackground();
}

// Browser tidak animasi background-image secara native, jadi dibikin "kedip halus"
// tiap ganti biar nggak snap kasar.
function pulseBackground() {
  const el = document.querySelector(".app-root");
  if (!el) return;
  el.classList.remove("app-root--pulse");
  void (el as HTMLElement).offsetWidth; // force reflow biar animasi bisa re-trigger
  el.classList.add("app-root--pulse");
}

// Salin gambar pilihan user ke folder milik aplikasi sendiri, supaya path-nya
// tetap valid lintas restart (path asli hasil file-picker bisa saja di luar
// scope asset protocol Tauri dan gagal dimuat ulang setelah app ditutup-buka).
export async function saveBackgroundImage(filePath: string): Promise<string> {
  return await invoke<string>("set_background_image", { file_path: filePath });
}

// ---- Ekstraksi warna dominan dari album art ----

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Sekunder otomatis: gelap kalau primary terang, terang kalau primary gelap
export function deriveSecondaryFor(primaryHex: string): string {
  return getLuminance(primaryHex) > 0.55 ? "#141414" : "#f5f5f5";
}

export function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue; // skip transparan
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) return resolve(null);
        resolve(
          rgbToHex(
            Math.round(r / count),
            Math.round(g / count),
            Math.round(b / count),
          ),
        );
      } catch {
        // Kemungkinan canvas ke-taint oleh webview - gagal dengan aman, jangan crash
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
