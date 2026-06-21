import { useEffect } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useQueueStore } from '../store/useQueueStore'

export function useKeyboardShortcuts(
  audioEngine: { play: () => void; pause: () => void; seek: (s: number) => void; toggle: () => void }
) {
  const { position, duration, toggleMute } = usePlayerStore()
  const { next, previous } = useQueueStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          audioEngine.toggle()
          break
        case 'ArrowRight':
          audioEngine.seek(Math.min(position + 5, duration))
          break
        case 'ArrowLeft':
          audioEngine.seek(Math.max(position - 5, 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          usePlayerStore.getState().setVolume(
            Math.min(usePlayerStore.getState().volume + 0.05, 1)
          )
          break
        case 'ArrowDown':
          e.preventDefault()
          usePlayerStore.getState().setVolume(
            Math.max(usePlayerStore.getState().volume - 0.05, 0)
          )
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        case 'n':
        case 'N':
          next()
          break
        case 'p':
        case 'P':
          previous()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [position, duration, audioEngine])
}