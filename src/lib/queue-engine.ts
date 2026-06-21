import type { Track } from '../types/track'

export function shuffleArray(tracks: Track[], anchorIndex = 0): Track[] {
  const arr = [...tracks]
  if (anchorIndex > 0 && anchorIndex < arr.length) {
    const [anchor] = arr.splice(anchorIndex, 1)
    arr.unshift(anchor)
  }
  for (let i = arr.length - 1; i > 1; i--) {
    const j = Math.floor(Math.random() * (i - 1)) + 1
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}