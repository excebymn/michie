import ColorThief from 'colorthief'

const thief = new ColorThief()

type RGB = [number, number, number]

function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function darken([r, g, b]: RGB, factor: number): RGB {
  return [
    Math.round(r * (1 - factor)),
    Math.round(g * (1 - factor)),
    Math.round(b * (1 - factor)),
  ]
}

function lighten([r, g, b]: RGB, factor: number): RGB {
  return [
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor),
  ]
}

function luminance([r, g, b]: RGB): number {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastText(bg: RGB): string {
  return luminance(bg) > 0.3 ? '#0a0a0a' : '#f0f0f0'
}

export interface MaterialPalette {
  primary: string
  onPrimary: string
  secondary: string
  surface: string
  background: string
  onSurface: string
  onBackground: string
}

export async function extractPalette(imgElement: HTMLImageElement): Promise<MaterialPalette> {
  await new Promise<void>((res) => {
    if (imgElement.complete) { res(); return }
    imgElement.onload = () => res()
  })

  const palette = thief.getPalette(imgElement, 6) as RGB[]
  const dominant = palette[0]

  const primary = darken(dominant, 0.25)
  const background = darken(dominant, 0.72)
  const surface = darken(dominant, 0.60)
  const secondary = palette[1] ?? lighten(dominant, 0.15)

  return {
    primary:       rgbToHex(primary),
    onPrimary:     contrastText(primary),
    secondary:     rgbToHex(secondary),
    surface:       rgbToHex(surface),
    background:    rgbToHex(background),
    onSurface:     contrastText(surface),
    onBackground:  contrastText(background),
  }
}

export function applyPaletteToDOM(palette: MaterialPalette) {
  const root = document.documentElement
  root.style.setProperty('--color-primary',      palette.primary)
  root.style.setProperty('--color-on-primary',   palette.onPrimary)
  root.style.setProperty('--color-secondary',    palette.secondary)
  root.style.setProperty('--color-surface',      palette.surface)
  root.style.setProperty('--color-background',   palette.background)
  root.style.setProperty('--color-on-surface',   palette.onSurface)
  root.style.setProperty('--color-on-background',palette.onBackground)
}