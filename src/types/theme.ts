export interface MaterialPalette {
  primary: string        // dominant color (darkened)
  onPrimary: string      // text on primary
  secondary: string      // accent
  surface: string        // card background
  background: string     // page background (darkest)
  onSurface: string      // body text
  onBackground: string
}

export interface ThemeState {
  palette: MaterialPalette | null
  isTransitioning: boolean
}