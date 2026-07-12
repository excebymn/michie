import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "./api";

export type WidgetMediaKind = "photo" | "gif" | "video";

const FILTERS: Record<WidgetMediaKind, { name: string; extensions: string[] }> = {
  photo: { name: "Gambar", extensions: ["png", "jpg", "jpeg", "webp", "bmp"] },
  gif: { name: "GIF", extensions: ["gif"] },
  video: { name: "Video", extensions: ["mp4", "webm", "mov", "mkv"] },
};

// Salin file pilihan user (photo/gif/video) ke folder milik app sendiri —
// pola sama seperti saveBackgroundImage di appearanceService.ts. Path asli
// hasil file-picker tidak dijamin bisa dibaca lagi lewat asset protocol
// Tauri setelah app di-restart, jadi harus di-copy dulu.
export async function saveWidgetMedia(
  filePath: string,
  kind: WidgetMediaKind,
): Promise<string> {
  return await invoke<string>("save_widget_media", {
    file_path: filePath,
    media_kind: kind,
  });
}

// Buka native file-picker Tauri buat satu jenis media, lalu langsung copy
// hasilnya ke folder app. Return null kalau user cancel dialog-nya.
// Return path RAW (bukan asset url) — pemanggil yang decide kapan mau
// convertFileSrc (mis. GifWidget butuh raw path buat di-fetch manual dulu
// sebelum di-decode ke frame-frame).
export async function pickAndSaveWidgetMedia(
  kind: WidgetMediaKind,
): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [FILTERS[kind]],
  });

  if (typeof selected !== "string") return null; // user cancel, atau (harusnya gak mungkin krn multiple:false) array

  return await saveWidgetMedia(selected, kind);
}

// Helper tampilan: ubah raw fs path (hasil saveWidgetMedia/pickAndSaveWidgetMedia)
// jadi URL yang bisa dipakai langsung di <img>/<video>/src.
export function widgetMediaAssetUrl(rawPath: string): string {
  return convertFileSrc(rawPath);
}