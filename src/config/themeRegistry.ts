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

import chromeCss from "../styles/themes/chrome.css?url";
import frostCss from "../styles/themes/frost.css?url";
import paperCss from "../styles/themes/paper.css?url";
import outlineCss from "../styles/themes/outline.css?url";
import neumorphismCss from "../styles/themes/neumorphism.css?url";
import neonCss from "../styles/themes/neon.css?url";

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
  { id: "frost", label: "Frost", cssUrl: frostCss },
  { id: "paper", label: "Paper", cssUrl: paperCss },
  { id: "outline", label: "Outline", cssUrl: outlineCss },
  { id: "neumorphism", label: "Neumorphism", cssUrl: neumorphismCss },
  { id: "neon", label: "Neon", cssUrl: neonCss },
];