// src/services/updateService.ts
//
// Wrapper tipis di atas `@tauri-apps/plugin-updater`. Sedikit beda dari
// service lain di project ini (yang biasanya wrap invoke() manual) karena
// plugin resmi ini sudah expose JS API sendiri — tapi tetap ditaruh di
// services/ biar konsisten sama pola 1 file per domain.

import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";

export interface UpdateProgress {
  downloaded: number;
  total: number;
}

/** null kalau sudah versi terbaru, atau Update kalau ada rilis baru tersedia. */
export async function checkForUpdate(): Promise<Update | null> {
  return await check();
}

/**
 * Download + install update, beresin state pemutaran, lalu relaunch app.
 * onProgress dipanggil berkali-kali selama proses download (buat progress bar UI).
 * Kalau berhasil, app relaunch sendiri di akhir fungsi ini — caller gak akan
 * sempat lihat kode setelah await ini jalan.
 */
export async function installUpdate(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
  let downloaded = 0;
  let total = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        total = event.data.contentLength ?? 0;
        onProgress?.({ downloaded: 0, total });
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        onProgress?.({ downloaded, total });
        break;
      case "Finished":
        onProgress?.({ downloaded: total, total });
        break;
    }
  });

  // Beresin player/Discord/media-controls SEBELUM relaunch (lihat updater.rs)
  await invoke("pre_update_cleanup");
  await relaunch();
}