const THEME_LINK_ID = 'michie-theme-stylesheet';

export const themeEngine = {
  applyTheme: (themeId: string) => {
    let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `/themes/${themeId}.css`;
    document.body.dataset.theme = themeId;
  },

  applyColorMode: (mode: 'dark' | 'light') => {
    document.body.dataset.colorMode = mode;
  },

  applyMotion: (motion: 'disabled' | 'normal' | 'smooth') => {
    document.body.dataset.motion = motion;
  },

  applyTransparency: (level: 'off' | 'low' | 'medium' | 'high') => {
    document.body.dataset.transparency = level;
  },
};