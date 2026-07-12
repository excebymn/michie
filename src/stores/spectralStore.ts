import { create } from "zustand";
import { spectralService, type SpectralAnalysisFull } from "../services/spectralService";

// Store ini adalah "titik temu" semua widget spektral (metrik, spectrogram,
// kurva spektrum, waveform, stereo correlation). Tujuannya supaya:
//
//   1. TERSINKRON -- kalau user pencet "Scan" di widget A, widget B/C/D
//      yang lagi nampilin lagu yang sama otomatis ke-update juga begitu
//      hasilnya selesai, tanpa perlu masing-masing widget nge-invoke sendiri.
//   2. TIDAK BERAT -- kalau 2+ widget kebetulan mount bareng buat lagu yang
//      sama dan sama-sama belum ada cache, mereka gak akan trigger 2x
//      analyze_song_spectrum yang sama-sama decode+FFT file yang sama.
//      Request yang lagi jalan di-dedupe lewat inFlightScans/inFlightChecks.
//
// Key dari semua map di bawah adalah song_path (BUKAN "lagu yang sedang
// diputar sekarang") -- jadi kalau user ganti lagu di tengah scan, entry
// untuk song_path lama tetap ke-update dengan benar begitu promise-nya
// selesai, terlepas dari lagu apa yang sedang tampil di layar saat itu.

interface SpectralStoreState {
  // undefined = belum pernah dicek ke DB sama sekali
  // null      = sudah dicek ke DB, belum pernah ada hasil scan
  // object    = hasil analisis (dari cache DB ataupun abis discan barusan)
  results: Record<string, SpectralAnalysisFull | null | undefined>;
  scanning: Record<string, boolean>;
  errors: Record<string, string | undefined>;

  // Cek cache DB untuk satu lagu (idempotent -- aman dipanggil berkali-kali,
  // cuma benar-benar nge-invoke sekali per song_path).
  ensureChecked: (songPath: string) => void;

  // Trigger scan penuh (tombol "Scan" / "Scan Ulang"). Aman dipanggil dari
  // widget manapun; kalau sudah ada scan yang lagi jalan untuk song_path
  // yang sama, request baru nempel ke promise yang sama (gak dobel kerja).
  scan: (songPath: string) => void;
}

const inFlightChecks = new Map<string, Promise<SpectralAnalysisFull | null>>();
const inFlightScans = new Map<string, Promise<SpectralAnalysisFull>>();

export const useSpectralStore = create<SpectralStoreState>((set, get) => ({
  results: {},
  scanning: {},
  errors: {},

  ensureChecked: (songPath) => {
    if (!songPath) return;
    if (songPath in get().results) return; // sudah pernah dicek (cache hit ataupun miss)

    let promise = inFlightChecks.get(songPath);
    if (!promise) {
      promise = spectralService.getCached(songPath);
      inFlightChecks.set(songPath, promise);
    }

    promise
      .then((res) => {
        set((s) => ({ results: { ...s.results, [songPath]: res } }));
      })
      .catch((e) => {
        console.error("spectralStore - Gagal baca cache:", e);
        set((s) => ({ results: { ...s.results, [songPath]: null } }));
      })
      .finally(() => {
        inFlightChecks.delete(songPath);
      });
  },

  scan: (songPath) => {
    if (!songPath) return;
    if (get().scanning[songPath]) return; // udah lagi jalan, gak usah dobel

    set((s) => ({
      scanning: { ...s.scanning, [songPath]: true },
      errors: { ...s.errors, [songPath]: undefined },
    }));

    let promise = inFlightScans.get(songPath);
    if (!promise) {
      promise = spectralService.analyze(songPath);
      inFlightScans.set(songPath, promise);
    }

    promise
      .then((res) => {
        set((s) => ({ results: { ...s.results, [songPath]: res } }));
      })
      .catch((e) => {
        console.error("spectralStore - Gagal menganalisis:", e);
        set((s) => ({
          errors: { ...s.errors, [songPath]: "Gagal menganalisis file ini." },
        }));
      })
      .finally(() => {
        inFlightScans.delete(songPath);
        set((s) => ({ scanning: { ...s.scanning, [songPath]: false } }));
      });
  },
}));