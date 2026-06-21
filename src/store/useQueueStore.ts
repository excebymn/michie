import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Track } from '../types/track'
import type { RepeatMode } from '../types/player'
import { shuffleArray } from '../lib/queue-engine'

interface QueueState {
  tracks: Track[]
  originalTracks: Track[]   // pre-shuffle order
  currentIndex: number
  shuffle: boolean
  repeat: RepeatMode

  // Actions
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  addNext: (track: Track) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  jumpTo: (index: number) => void
  next: () => number | null    // returns new index
  previous: () => number | null
  toggleShuffle: () => void
  setRepeat: (mode: RepeatMode) => void
  clear: () => void
}

export const useQueueStore = create<QueueState>()(
  immer((set, get) => ({
    tracks: [],
    originalTracks: [],
    currentIndex: -1,
    shuffle: false,
    repeat: 'none',

    setQueue: (tracks, startIndex = 0) => set(state => {
      state.originalTracks = tracks
      state.tracks = state.shuffle ? shuffleArray(tracks, startIndex) : [...tracks]
      state.currentIndex = state.shuffle ? 0 : startIndex
    }),

    addToQueue: (track) => set(state => {
      state.tracks.push(track)
      state.originalTracks.push(track)
    }),

    addNext: (track) => set(state => {
      const insertAt = state.currentIndex + 1
      state.tracks.splice(insertAt, 0, track)
      state.originalTracks.splice(insertAt, 0, track)
    }),

    removeFromQueue: (index) => set(state => {
      state.tracks.splice(index, 1)
      if (index < state.currentIndex) state.currentIndex--
    }),

    reorderQueue: (from, to) => set(state => {
      const [track] = state.tracks.splice(from, 1)
      state.tracks.splice(to, 0, track)
      if (from === state.currentIndex) {
        state.currentIndex = to
      } else if (from < state.currentIndex && to >= state.currentIndex) {
        state.currentIndex--
      } else if (from > state.currentIndex && to <= state.currentIndex) {
        state.currentIndex++
      }
    }),

    jumpTo: (index) => set(state => { state.currentIndex = index }),

    next: () => {
      const { tracks, currentIndex, repeat } = get()
      if (tracks.length === 0) return null

      if (repeat === 'one') return currentIndex

      const nextIdx = currentIndex + 1
      if (nextIdx >= tracks.length) {
        if (repeat === 'all') {
          set(state => { state.currentIndex = 0 })
          return 0
        }
        return null
      }

      set(state => { state.currentIndex = nextIdx })
      return nextIdx
    },

    previous: () => {
      const { currentIndex } = get()
      if (currentIndex <= 0) return 0
      const prevIdx = currentIndex - 1
      set(state => { state.currentIndex = prevIdx })
      return prevIdx
    },

    toggleShuffle: () => set(state => {
      state.shuffle = !state.shuffle
      const current = state.tracks[state.currentIndex]
      if (state.shuffle) {
        state.tracks = shuffleArray(state.originalTracks, 
          state.originalTracks.findIndex(t => t.id === current?.id))
        state.currentIndex = 0
      } else {
        state.tracks = [...state.originalTracks]
        state.currentIndex = current 
          ? state.originalTracks.findIndex(t => t.id === current.id) 
          : 0
      }
    }),

    setRepeat: (mode) => set(state => { state.repeat = mode }),
    clear: () => set(state => { 
      state.tracks = []; state.originalTracks = []; state.currentIndex = -1 
    }),
  }))
)