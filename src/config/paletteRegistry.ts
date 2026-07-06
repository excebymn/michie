export interface PaletteDefinition {
  id: string;
  label: string;
  primary: string;
  secondary: string;
}

export const paletteRegistry: PaletteDefinition[] = [
  { id: 'cyprus', label: 'sand', primary: '#004741', secondary: '#f0ede4' },
    { id: 'sand', label: 'cyprus', primary: '#f0ede4', secondary: '#004741' },
];