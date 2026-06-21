import { create } from 'zustand'
import type { MaterialPalette } from '../types/theme'

interface ThemeStore {
  palette: MaterialPalette | null
  isTransitioning: boolean
  setPalette: (p: MaterialPalette | null) => void
  setTransitioning: (v: boolean) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  palette: null,
  isTransitioning: false,
  setPalette: (palette) => set({ palette }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}))