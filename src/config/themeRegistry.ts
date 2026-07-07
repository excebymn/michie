export interface ThemeDefinition {
  id: string;
  label: string;
  cssUrl: string;
}

// Gunakan suffix `?url` agar Vite mengembalikan URL asset,
// bukan meng-inject CSS langsung.

import glassCss from "../styles/themes/glass.css?url";
import flatCss from "../styles/themes/flat.css?url";
import puddingCss from "../styles/themes/pudding.css?url";
import retroCss from "../styles/themes/retro.css?url";
import css3dCss from "../styles/themes/3d.css?url";
import jellyCss from "../styles/themes/jelly.css?url";
import woodCss from "../styles/themes/wood.css?url";
import chromeCss from "../styles/themes/chrome.css?url";
import terminalCss from "../styles/themes/terminal.css?url";
import paperCss from "../styles/themes/paper.css?url";
import pixelCss from "../styles/themes/pixel.css?url";
import amoledCss from "../styles/themes/amoled.css?url";
import denimCss from "../styles/themes/denim.css?url";

export const themeRegistry: ThemeDefinition[] = [
  // Tema utama
  { id: "glass", label: "Glass", cssUrl: glassCss },
  { id: "flat", label: "Flat", cssUrl: flatCss },
  { id: "pudding", label: "Pudding", cssUrl: puddingCss },
  { id: "retro", label: "Retro", cssUrl: retroCss },
  { id: "3d", label: "3D", cssUrl: css3dCss },
  { id: "jelly", label: "Jelly", cssUrl: jellyCss },

  // Tema tambahan
  { id: "chrome", label: "Chrome", cssUrl: chromeCss },
  { id: "terminal", label: "Terminal", cssUrl: terminalCss },
  { id: "paper", label: "Paper", cssUrl: paperCss },
  { id: "pixel", label: "pixel", cssUrl: pixelCss },
  { id: "amoled", label: "AMOLED", cssUrl: amoledCss },
  { id: "denim", label: "Denim", cssUrl: denimCss },
  { id: "wood", label: "Wood", cssUrl: woodCss },
];