import create from "zustand";
import { appService } from "../services/appService";
import { settingsService } from "../services/settingsService";
import type {
  AlbumDetails,
  AllArtistResults,
  AllGenreResults,
  DirectoryInfo,
  Playlists,
  SongsFull,
  PlayHistory,
} from "../globalValues";

interface AppState {
  songList: SongsFull[];
  albumList: AlbumDetails[];
  artistList: AllArtistResults[];
  genreList: AllGenreResults[];
  playlistList: Playlists[];
  directories: DirectoryInfo[];
  playHistory: PlayHistory[];
  theme: string;
  newVersionAvailable: boolean;
  isScanning: boolean;
  scanCurrent: number;
  scanLength: number;
  backupRestoreStatus: number;
  loadTheme: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  loadInitialData: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshDirectories: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  setScanning: (value: boolean) => void;
  setScanProgress: (current: number, length: number) => void;
  setBackupRestoreStatus: (status: number) => void;
  setSongFavorited: (path: string, favorited: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  songList: [],
  albumList: [],
  artistList: [],
  genreList: [],
  playlistList: [],
  directories: [],
  playHistory: [],
  theme: "red",
  newVersionAvailable: false,
  isScanning: false,
  scanCurrent: 0,
  scanLength: 0,
  backupRestoreStatus: 0,

  loadTheme: async () => {
    const storedTheme = await appService.getSettings();
    const theme = storedTheme ?? localStorage.getItem("theme") ?? "red";
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  refreshLibrary: async () => {
    const [songList, albumList, artistList, genreList, playlistList] =
      await Promise.all([
        appService.getAllSongs(),
        appService.getAllAlbums(),
        appService.getAllArtists(),
        appService.getAllGenres(),
        appService.getAllPlaylists(),
      ]);
    set({ songList, albumList, artistList, genreList, playlistList });
  },

  loadInitialData: async () => {
    await get().loadTheme();
    await get().refreshLibrary();
    await appService.scanForDeleted();
    const versionAvailable = await appService.checkForNewVersion();
    set({ newVersionAvailable: versionAvailable });
  },

  refreshPlaylists: async () => {
    const playlistList = await appService.getAllPlaylists();
    set({ playlistList });
  },

  refreshHistory: async () => {
    const history = await appService.getPlayHistory(25);
    set({ playHistory: history });
  },

  refreshDirectories: async () => {
    const directories = await settingsService.getDirectories();
    set({ directories });
  },

  updateTheme: async (theme: string) => {
    await settingsService.setTheme(theme);
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  setScanning: (value: boolean) => set({ isScanning: value }),
  setScanProgress: (current: number, length: number) =>
    set({ scanCurrent: current, scanLength: length }),
  setBackupRestoreStatus: (status: number) =>
    set({ backupRestoreStatus: status }),

  setSongFavorited: (path: string, favorited: boolean) =>
    set((state) => ({
      songList: state.songList.map((s) =>
        s.path === path ? { ...s, favorited } : s,
      ),
    })),
}));
