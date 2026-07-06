import { themeRegistry } from '../config/themeRegistry';
import { paletteRegistry } from '../config/paletteRegistry';

const THEME_LINK_ID = 'app-theme-stylesheet';

function getOrCreateThemeLink(): HTMLLinkElement {
  let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = THEME_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return link;
}

export function applyTheme(themeId: string) {
  const theme = themeRegistry.find(t => t.id === themeId);
  if (!theme) return;
  getOrCreateThemeLink().href = theme.cssUrl;
}

export function applyPalette(paletteId: string) {
  const palette = paletteRegistry.find(p => p.id === paletteId);
  if (!palette) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-secondary', palette.secondary);
}

export function applyBackgroundColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty('--app-background', hex);
  root.style.setProperty('--app-background-image', 'none');
}

export function applyBackgroundImage(assetUrl: string) {
  document.documentElement.style.setProperty('--app-background-image', `url("${assetUrl}")`);
}