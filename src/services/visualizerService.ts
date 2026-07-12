// Service terpusat buat event "visualizer-levels".
//
// Kenapa perlu ini: sebelumnya tiap widget visualizer (RadialVisualizer,
// VisualizerWidget, SmoothWave) punya listener Tauri sendiri-sendiri lewat
// onEvent(). Kalau beberapa widget mounted bareng, event yang SAMA dari
// backend diproses berkali-kali secara terpisah (sekali per widget).
//
// Pola di sini ngikutin konvensi yang udah dipakai MainPlayer/index.tsx:
// SATU listener Tauri, baru fan-out ke consumer manapun yang butuh.
// Bedanya di sini fan-out-nya bukan ke Zustand store (karena update-nya
// frequent — ~24x/detik — dan gak perlu trigger React re-render), tapi
// langsung ke callback tiap widget yang manipulasi ref-nya sendiri,
// persis kayak pola lama, cuma listener Tauri-nya sekarang cuma satu.
//
// BARU: selain nge-dedupe listener Tauri di sisi frontend, service ini juga
// ngasih tau BACKEND ada widget yang aktif lewat command visualizer_subscribe
// / visualizer_unsubscribe. Kalau gak ada satupun widget yang subscribe,
// engine FFT di Rust berhenti total (gak lock player, gak hitung, gak emit)
// — bukan cuma "gak ada yang dengerin di frontend" kayak sebelumnya.

import { onEvent } from "./api";
import { invoke } from "@tauri-apps/api/core";
// ^ Kalau api.ts kamu udah punya wrapper invoke sendiri (dengan logging/error
// handling konsisten), pakai itu aja sebagai gantinya biar konsisten sama
// service lain — fungsinya sama persis.

type Listener = (levels: number[]) => void;

const listeners = new Set<Listener>();
let unlisten: (() => void) | null = null;
let latestLevels: number[] | null = null;

async function ensureSubscribed() {
  if (unlisten) return;
  unlisten = await onEvent<{ levels: number[] }>("visualizer-levels", (e) => {
    latestLevels = e.payload.levels;
    listeners.forEach((cb) => cb(e.payload.levels));
  });
}

/**
 * Subscribe ke level visualizer. Aman dipanggil dari berapa pun widget yang
 * mounted bareng — listener Tauri & "engine" di backend cuma aktif kalau
 * minimal ada 1 subscriber, dan mati total begitu subscriber terakhir lepas.
 * Return unsubscribe function buat dipanggil di cleanup useEffect.
 */
export function subscribeVisualizer(cb: Listener): () => void {
  const wasEmpty = listeners.size === 0;
  listeners.add(cb);
  void ensureSubscribed();

  if (wasEmpty) {
    // Widget pertama yang subscribe -> nyalain engine di backend.
    void invoke("visualizer_subscribe").catch(() => {
      // Gagal invoke gak fatal buat UI, cuma berarti backend gak tau ada
      // subscriber -> visualizer diem. Cukup di-swallow, bukan crash render.
    });
  }

  // Widget yang baru mounted langsung dapet snapshot terakhir, gak perlu
  // nunggu event backend berikutnya (~42ms) buat nampilin sesuatu.
  if (latestLevels) cb(latestLevels);

  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      latestLevels = null; // biar widget berikutnya yang mounted gak nampilin data basi
      // Subscriber terakhir lepas -> matiin engine di backend.
      void invoke("visualizer_unsubscribe").catch(() => {});
    }
  };
}