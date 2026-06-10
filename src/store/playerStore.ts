import { create } from "zustand"
import type { PlayerState, Track } from "../types/player"

interface PlayerActions {
  setTrack: (track: Track) => void
  togglePlay: () => void
  setTime: (time: number) => void
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  track: null,
  isPlaying: false,
  currentTime: 0,

  setTrack: (track) => set({ track }),

  togglePlay: () =>
    set((state) => ({ isPlaying: !state.isPlaying })),

  setTime: (time) => set({ currentTime: time }),
}))