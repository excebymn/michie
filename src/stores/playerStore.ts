import create from "zustand";
import { playerService } from "../services/playerService";
import { useAppStore } from "./appStore";
import type { Songs } from "../globalValues";

interface PlayerState {
  currentSong: Songs | null;
  queue: Songs[];
  currentIndex: number;
  isLoaded: boolean;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: number;
  volume: number;
  songProgress: number;
  hasLyrics: boolean;
  lyrics: { plain_lyrics: string[]; synced_lyrics: string[] };
  loadPlayerState: () => Promise<void>;
  setCurrentSong: (song: Songs) => void;
  patchCurrentSong: (patch: Partial<Songs>) => void;
  setCurrentIndex: (index: number) => void;
  refreshCurrentIndex: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (value: number) => Promise<void>;
  setVolume: (value: number) => Promise<void>;
  setRepeatMode: (mode: number) => Promise<void>;
  setShuffleMode: () => Promise<void>;
  setShuffleModeState: (shuffled: boolean) => void;
  loadQueue: () => Promise<void>;
  stop: () => void;
  updateSongDetails: (songPath: string) => Promise<void>;
  setSongProgress: (progress: number) => void;
  setIsPlaying: (value: boolean) => void;
  addToQueue: (songs: Songs[]) => Promise<void>;
  playNext: (songs: Songs[]) => Promise<void>;
  removeFromQueueAt: (index: number) => Promise<void>;
  reorderQueueItems: (fromIndex: number, toIndex: number) => Promise<void>;
  jumpToQueueIndex: (index: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  currentIndex: 0,
  isLoaded: false,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 1,
  volume: 20,
  songProgress: 0,
  hasLyrics: false,
  lyrics: { plain_lyrics: [], synced_lyrics: [] },

  loadPlayerState: async () => {
    const qPositionString = localStorage.getItem("last-played-queue-position");
    const shuffleMode = JSON.parse(
      localStorage.getItem("shuffle-mode") ?? "false",
    );
    const storedVolume = JSON.parse(
      localStorage.getItem("volume-level") ?? "20",
    );
    set({ volume: storedVolume ?? 20, isShuffle: shuffleMode ?? false });

    if (qPositionString !== null) {
      const queue = await playerService.getQueue(
        shuffleMode !== null ? shuffleMode : false,
      );
      const position = Number(qPositionString);
      if (queue.length > position) {
        const currentSong = queue[position];
        // Backend restart selalu mulai dengan queue & sink kosong — DB/localStorage
        // cuma menyimpan tampilan terakhir di frontend. Tanpa panggilan ini, tombol
        // play tidak akan berbunyi karena sink Rust-nya benar-benar kosong.
        await playerService.setupQueueAndSong(queue, position);
        set({
          queue,
          currentSong,
          isLoaded: true,
          songProgress: 0,
          isPlaying: false,
          currentIndex: position,
        });
      }
    }
  },

  setCurrentSong: (song: Songs) =>
    set({
      currentSong: song,
      isLoaded: true,
      isPlaying: true,
      songProgress: 0,
    }),

  patchCurrentSong: (patch: Partial<Songs>) =>
    set((state) =>
      state.currentSong
        ? { currentSong: { ...state.currentSong, ...patch } }
        : {},
    ),

  setCurrentIndex: (index: number) => set({ currentIndex: index }),

  refreshCurrentIndex: async () => {
    const index = await playerService.getCurrentIndex();
    localStorage.setItem("last-played-queue-position", String(index));
    set({ currentIndex: index });
  },

  play: async () => {
    await playerService.play();
    set({ isPlaying: true });
  },

  pause: async () => {
    await playerService.pause();
    set({ isPlaying: false });
  },

  next: async () => {
    const qPosition = await playerService.getCurrentPosition();
    const qLength = await playerService.getQueueLength();
    if (get().repeatMode === 0 && qPosition + 1 > qLength - 1) {
      await playerService.stop();
      set({ isPlaying: false, songProgress: 0 });
      return;
    }
    const currentSong = get().currentSong;
    if (get().isShuffle && qPosition + 1 > qLength - 1 && currentSong) {
      await playerService.shuffleQueue(currentSong.path, true);
    }
    await playerService.nextSong();
    const song = await playerService.getCurrentSong();
    playerService.addSongToHistory(song.path);
    set({ currentSong: song, isPlaying: true, songProgress: 0 });
    await get().refreshCurrentIndex();
  },

  previous: async () => {
    if (!get().isLoaded) return;
    if (get().songProgress > 3) {
      await playerService.seek(0);
      set({ songProgress: 0 });
    } else {
      await playerService.previousSong();
      const song = await playerService.getCurrentSong();
      playerService.addSongToHistory(song.path);
      set({ currentSong: song, isPlaying: true, songProgress: 0 });
      await get().refreshCurrentIndex();
    }
  },

  seek: async (value: number) => {
    await playerService.seek(value);
    set({ songProgress: value, isPlaying: true });
  },

  setVolume: async (value: number) => {
    await playerService.setVolume(value / 50);
    localStorage.setItem("volume-level", JSON.stringify(value));
    set({ volume: value });
  },

  setRepeatMode: async (mode: number) => {
    await playerService.setRepeatMode(mode);
    localStorage.setItem("repeat-mode", JSON.stringify(mode));
    set({ repeatMode: mode });
  },

  setShuffleMode: async () => {
    const shuffled = !get().isShuffle;
    const currentSong = get().currentSong;
    if (currentSong) {
      await playerService.shuffleQueue(currentSong.path, shuffled);
    }
    localStorage.setItem("shuffle-mode", JSON.stringify(shuffled));
    set({ isShuffle: shuffled });
    await get().loadQueue();
    await get().refreshCurrentIndex();
  },

  setShuffleModeState: (shuffled: boolean) => {
    localStorage.setItem("shuffle-mode", JSON.stringify(shuffled));
    set({ isShuffle: shuffled });
  },

  loadQueue: async () => {
    const queue = await playerService.getQueue(get().isShuffle);
    set({ queue });
  },

  stop: () => set({ isPlaying: false, isLoaded: false, songProgress: 0 }),

  updateSongDetails: async (songPath: string) => {
    const song = await playerService.getSong(songPath);
    set({ currentSong: song, isLoaded: true });
  },

  setSongProgress: (progress: number) => set({ songProgress: progress }),
  setIsPlaying: (value: boolean) => set({ isPlaying: value }),

  addToQueue: async (songs: Songs[]) => {
    await playerService.addToQueueEnd(songs, get().isShuffle);
    await get().loadQueue();
  },

  playNext: async (songs: Songs[]) => {
    await playerService.playNext(songs, get().isShuffle);
    await get().loadQueue();
  },

  removeFromQueueAt: async (index: number) => {
    await playerService.removeFromQueue(index, get().isShuffle);
    await get().loadQueue();
    await get().refreshCurrentIndex();
  },

  reorderQueueItems: async (fromIndex: number, toIndex: number) => {
    await playerService.reorderQueue(fromIndex, toIndex, get().isShuffle);
    await get().loadQueue();
    await get().refreshCurrentIndex();
  },

  jumpToQueueIndex: async (index: number) => {
    await playerService.jumpToQueueIndex(index);
    const song = await playerService.getCurrentSong();
    playerService.addSongToHistory(song.path);
    set({ currentSong: song, isPlaying: true, songProgress: 0 });
    await get().refreshCurrentIndex();
  },
}));
