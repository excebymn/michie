import { create } from 'zustand';
import { PlayerState, Track, RepeatMode } from '../types/player';

interface PlayerActions {
  setTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setQueue: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleLikeTrack: (trackId: string) => void;
  setSelectedFolder: (path: string | null) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  track: null,
  isPlaying: false,
  currentTime: 0,
  volume: 70,
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  repeatMode: 'off',
  likedTracks: [],
  selectedFolder: null,

  setTrack: (track) => set({ track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setVolume: (volume) => set({ volume }),
  setQueue: (queue) => set({ queue }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  toggleLikeTrack: (trackId) => set((state) => ({
    likedTracks: state.likedTracks.includes(trackId)
      ? state.likedTracks.filter((id) => id !== trackId)
      : [...state.likedTracks, trackId]
  })),
  setSelectedFolder: (selectedFolder) => set({ selectedFolder }),
}));