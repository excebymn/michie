export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export type BackgroundMode = 'color' | 'image';
export type PanelMode = 'glass-solid' | 'solid' | 'glass';