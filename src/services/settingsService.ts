import { invoke } from "./api";
import type { DirectoryInfo } from "../globalValues";

export const settingsService = {
  getDirectories: async () => await invoke<DirectoryInfo[]>("get_directory"),
  addDirectory: async (directory: string) => await invoke<void>("add_directory", { directory_name: directory }),
  removeDirectory: async (directory: string) => await invoke<void>("remove_directory", { directory_name: directory }),
  scanDirectory: async () => await invoke<unknown>("scan_directory"),
  checkForOngoingScan: async () => await invoke<boolean>("check_for_ongoing_scan"),
  checkForBackupRestore: async () => await invoke<number>("check_for_backup_restore"),
  createBackup: async () => await invoke<void>("create_backup"),
  useRestore: async () => await invoke<void>("use_restore"),
  resetDatabase: async () => await invoke<void>("reset_database"),
  clearQueue: async () => await invoke<void>("clear_queue"),
  addPlaylistCover: async (filePath: string, playlistName: string, playlistId: number) =>
    await invoke<void>("add_playlist_cover", { file_path: filePath, playlist_name: playlistName, playlist_id: playlistId }),
  setTheme: async (theme: string) => await invoke<void>("set_theme", { theme_color: theme }),
  getTheme: async () => await invoke<string>("get_settings"),
  importPlaylistFile: async (filePath: string) => await invoke<void>("import_playlist", { file_path: filePath }),
  exportPlaylistFile: async (folderPath: string, playlistId: number) =>
    await invoke<void>("export_playlist", { save_file_location: folderPath, playlist_id: playlistId }),
};