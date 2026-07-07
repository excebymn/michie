import { invoke, onEvent, type EventHandler } from "./api";
import type {
  AlbumDetails,
  AllArtistResults,
  AllGenreResults,
  Playlists,
  SongsFull,
  DirectoryInfo,
  PlayHistory,
} from "../globalValues";

export const appService = {
  getSettings: async () => await invoke<string | null>("get_settings"),
  getAllSongs: async () => await invoke<SongsFull[]>("get_all_songs"),
  getAllAlbums: async () => await invoke<AlbumDetails[]>("get_all_albums"),
  getAllArtists: async () =>
    await invoke<AllArtistResults[]>("get_all_artists"),
  getAllGenres: async () => await invoke<AllGenreResults[]>("get_all_genres"),
  getAllPlaylists: async () => await invoke<Playlists[]>("get_all_playlists"),
  getDirectories: async () => await invoke<DirectoryInfo[]>("get_directory"),
  scanForDeleted: async () => await invoke<void>("scan_for_deleted"),
  checkForNewVersion: async () =>
    await invoke<boolean>("check_for_new_version"),
  checkForOngoingScan: async () =>
    await invoke<boolean>("check_for_ongoing_scan"),
  checkForBackupRestore: async () =>
    await invoke<number>("check_for_backup_restore"),
  getPlayHistory: async (limit: number) =>
    await invoke<PlayHistory[]>("get_play_history", { limit }),

  getLikedSongs: async () => await invoke<SongsFull[]>("get_liked_songs"),
  toggleFavorite: async (path: string) =>
    await invoke<boolean>("toggle_favorite_song", { path }),

  onScanFinished: async (handler: EventHandler<void>) =>
    await onEvent("scan-finished", handler),
  onScanProgress: async (
    handler: EventHandler<{ length: number; current: number }>,
  ) => await onEvent("scan-length", handler),
  onScanStarted: async (handler: EventHandler<void>) =>
    await onEvent("scan-started", handler),
  onRestoreFinished: async (handler: EventHandler<void>) =>
    await onEvent("ending-restore", handler),
  onResetFinished: async (handler: EventHandler<void>) =>
    await onEvent("ending-reset", handler),
  onBackupFinished: async (handler: EventHandler<void>) =>
    await onEvent("ending-backup", handler),
  onPlaylistCreated: async (handler: EventHandler<{ playlist: Playlists[] }>) =>
    await onEvent("new-playlist-created", handler),
  onSongFavoritedChanged: async (
    handler: EventHandler<{ path: string; favorited: boolean }>,
  ) => await onEvent("song-favorited-changed", handler),
};
