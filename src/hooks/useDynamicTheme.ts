import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useThemeStore } from '../store/useThemeStore'
import { extractPalette, applyPaletteToDOM } from '../lib/color-extractor'
import { convertFileSrc } from '@tauri-apps/api/core'

export function useDynamicTheme() {
  const { currentTrack } = usePlayerStore()
  const { setPalette, setTransitioning } = useThemeStore()
  const imgRef = useRef<HTMLImageElement>(new Image())

  useEffect(() => {
    if (!currentTrack?.artworkPath) {
      document.documentElement.removeAttribute('style')
      setPalette(null)
      return
    }

    const img = imgRef.current
    img.crossOrigin = 'anonymous'
    img.src = convertFileSrc(currentTrack.artworkPath)

    img.onload = async () => {
      try {
        setTransitioning(true)
        const palette = await extractPalette(img)
        
        document.documentElement.style.transition = 'background-color 600ms ease, color 600ms ease'
        applyPaletteToDOM(palette)
        setPalette(palette)
        
        setTimeout(() => setTransitioning(false), 600)
      } catch (e) {
        console.warn('Theme extraction failed:', e)
        setTransitioning(false)
      }
    }
  }, [currentTrack?.artworkPath])
}