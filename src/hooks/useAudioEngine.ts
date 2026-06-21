import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useQueueStore } from '../store/useQueueStore'
import { convertFileSrc } from '@tauri-apps/api/core'

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { setPosition, setDuration, setStatus, volume, isMuted } = usePlayerStore()
  const { tracks, currentIndex, next } = useQueueStore()

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => setPosition(audio.currentTime))
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('playing', () => setStatus('playing'))
    audio.addEventListener('pause', () => setStatus('paused'))
    audio.addEventListener('waiting', () => setStatus('loading'))
    audio.addEventListener('error', () => setStatus('error'))
    audio.addEventListener('ended', () => {
      const nextIndex = next()
      if (nextIndex === null) setStatus('idle')
    })

    return () => { audio.pause(); audio.src = '' }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const track = tracks[currentIndex]
    if (!track || !audioRef.current) return

    setStatus('loading')
    audioRef.current.src = convertFileSrc(track.filePath)
    audioRef.current.play().catch(() => setStatus('error'))
  }, [currentIndex, tracks])

  const play = useCallback(() => audioRef.current?.play(), [])
  const pause = useCallback(() => audioRef.current?.pause(), [])
  const seek = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds
  }, [])
  const toggle = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()
  }, [])

  return { play, pause, seek, toggle }
}