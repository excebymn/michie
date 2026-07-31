import { invoke, onEvent, type EventHandler } from "./api";
import type { DirectoryInfo, VideoInfo, TranscodeProgress } from "../globalValues";

export const videoService = {
  // ---- Directories ----
  getDirectories: async () =>
    await invoke<DirectoryInfo[]>("get_video_directory"),
  addDirectory: async (directory_name: string) =>
    await invoke<void>("add_video_directory", { directory_name }),
  removeDirectory: async (directory_name: string) =>
    await invoke<void>("remove_video_directory", { directory_name }),

  // ---- Scan ----
  scanDirectory: async () => await invoke<void>("scan_video_directory"),
  scanForDeleted: async () => await invoke<void>("scan_video_for_deleted"),

  // ---- Library ----
  getAllVideos: async () => await invoke<VideoInfo[]>("get_all_videos"),
  deleteVideo: async (path: string) =>
    await invoke<void>("delete_video", { path }),
  setSubtitle: async (video_path: string, subtitle_file_path: string) =>
    await invoke<string>("set_video_subtitle", {
      video_path,
      subtitle_file_path,
    }),
  clearSubtitle: async (video_path: string) =>
    await invoke<void>("clear_video_subtitle", { video_path }),

  // ---- Playback prep (BARU) ----
  // Return path yang siap dipakai ke convertFileSrc() — bisa file asli
  // (kalau sudah kompatibel) atau hasil transcode di cache. Selama proses
  // ini, backend bisa emit video-transcode-* events (lihat di bawah).
  prepareVideoPlayback: async (video_path: string) =>
    await invoke<string>("prepare_video_playback", { video_path }),

  // ---- Events ----
  onScanStarted: async (handler: EventHandler<boolean>) =>
    await onEvent("video-scan-started", handler),
  onScanProgress: async (
    handler: EventHandler<{ length: number; current: number }>,
  ) => await onEvent("video-scan-length", handler),
  onScanFinished: async (handler: EventHandler<boolean>) =>
    await onEvent("video-scan-finished", handler),

  // BARU — event transcode
  onTranscodeStarted: async (handler: EventHandler<string>) =>
    await onEvent("video-transcode-started", handler),
  onTranscodeProgress: async (handler: EventHandler<TranscodeProgress>) =>
    await onEvent("video-transcode-progress", handler),
  onTranscodeFinished: async (handler: EventHandler<string>) =>
    await onEvent("video-transcode-finished", handler),
  onTranscodeFailed: async (handler: EventHandler<string>) =>
    await onEvent("video-transcode-failed", handler),
};