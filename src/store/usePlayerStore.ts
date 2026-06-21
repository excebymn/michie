import { create } from 'zustand'
import type { PlaybackStatus } from '../types/player'
import type { Track } from '../types/track'

interface PlayerStore {
  status: PlaybackStatus
  currentTrack: Track | null
  position: number
  duration: number
  volume: number
  isMuted: boolean

  setStatus: (s: PlaybackStatus) => void
  setCurrentTrack: (t: Track | null) => void
  setPosition: (p: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  status: 'idle',
  currentTrack: null,
  position: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,

  setStatus: (status) => set({ status }),
  setCurrentTrack: (currentTrack) => set({ currentTrack, position: 0 }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
}))