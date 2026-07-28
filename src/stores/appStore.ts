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
  hasSeenManual: boolean;
  loadTheme: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  rescanLibrary: () => Promise<void>;
  loadInitialData: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshDirectories: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  setScanning: (value: boolean) => void;
  setScanProgress: (current: number, length: number) => void;
  setBackupRestoreStatus: (status: number) => void;
  setSongFavorited: (path: string, favorited: boolean) => void;
  markManualSeen: () => Promise<void>;
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
  // Default true, biar popup Manual gak sempat "kelip" muncul sebelum
  // loadInitialData selesai ngecek nilai aslinya dari DB.
  hasSeenManual: true,

  loadTheme: async () => {
    const storedTheme = await appService.getSettings();
    const theme = storedTheme ?? localStorage.getItem("theme") ?? "red";
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  // Cuma re-fetch data yang SUDAH ada di DB, TIDAK men-scan folder di disk.
  // Ini yang dipanggil `loadInitialData` tiap app dibuka — harus tetap
  // ringan/cepat. Jangan taruh `scanDirectory`/`scanForDeleted` di sini lagi,
  // itu penyebab app jadi full-rescan tiap kali dibuka (lihat `rescanLibrary`
  // untuk aksi scan yang sebenarnya).
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

  // Aksi scan yang sebenarnya: jalankan `scan_directory` + `scan_for_deleted`
  // di backend, baru refresh data di frontend. Dipakai tombol "Rescan" dan
  // saat user nambah folder baru — TIDAK dipanggil saat startup.
  rescanLibrary: async () => {
    set({ isScanning: true });
    try {
      await settingsService.scanDirectory();
      await appService.scanForDeleted();
      await get().refreshLibrary();
    } finally {
      set({ isScanning: false });
    }
  },

  loadInitialData: async () => {
    await get().loadTheme();
    await get().refreshLibrary();
    await appService.scanForDeleted();
    const versionAvailable = await appService.checkForNewVersion();
    set({ newVersionAvailable: versionAvailable });
    // BARU — cek apakah user sudah pernah lihat popup Manual/cara pakai
    const hasSeenManual = await settingsService.getManualSeen();
    set({ hasSeenManual });
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

  // BARU — dipanggil saat user menutup popup Manual pertama kali (atau
  // membuka panel Manual di SettingsCenter): simpan permanen ke DB supaya
  // popup gak muncul lagi tiap app dibuka.
  markManualSeen: async () => {
    await settingsService.setManualSeen(true);
    set({ hasSeenManual: true });
  },
}));