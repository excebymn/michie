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
import newspaper from "../styles/themes/newspaper.css?url";
import ceramic from "../styles/themes/ceramic.css?url";
import artdeco from "../styles/themes/artdeco.css?url";
import sephia from "../styles/themes/sephia.css?url";

export const themeRegistry: ThemeDefinition[] = [
// ⭐ Recommended
{ id: "flat", label: "Flat", cssUrl: flatCss },
{ id: "denim", label: "Denim", cssUrl: denimCss },
{ id: "pixel", label: "Pixel", cssUrl: pixelCss },
{ id: "retro", label: "Retro", cssUrl: retroCss },

// 🎨 More Themes
{ id: "glass", label: "Glass", cssUrl: glassCss },
{ id: "jelly", label: "Jelly", cssUrl: jellyCss },
{ id: "3d", label: "3D", cssUrl: css3dCss },
{ id: "chrome", label: "Chrome", cssUrl: chromeCss },
{ id: "paper", label: "Paper", cssUrl: paperCss },
{ id: "amoled", label: "AMOLED", cssUrl: amoledCss },
{ id: "wood", label: "Wood", cssUrl: woodCss },
{ id: "ceramic", label: "Ceramic", cssUrl: ceramic },
{ id: "artdeco", label: "Art Deco", cssUrl: artdeco },
{ id: "terminal", label: "Terminal", cssUrl: terminalCss },
{ id: "newspaper", label: "Newspaper", cssUrl: newspaper },
{ id: "sephia", label: "Sephia", cssUrl: sephia },
{ id: "pudding", label: "Pudding", cssUrl: puddingCss },
]