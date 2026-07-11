import { create } from "zustand";
import { usePlayerStore } from "../stores/playerStore";
import { lyricsService } from "../services/lyricsService";
import { parseLrc, type LrcLine } from "../utils/parseLrc";
import type { LyricsCandidate, LyricsLookupResult } from "../types/lyrics";

export type { LrcLine };

export type LyricsPhase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "selecting"; candidates: LyricsCandidate[] }
  | { kind: "synced"; lines: LrcLine[] }
  | { kind: "plain"; lines: string[] };

interface LyricsStoreState {
  phase: LyricsPhase;
  pickCandidate: (candidate: LyricsCandidate) => Promise<void>;
}

// Nomor request "aktif" saat ini. Dipakai buat buang respons basi kalau lagu
// keburu ganti lagi sebelum request lama selesai (padanan requestIdRef di
// versi hook lama, sekarang di module scope karena cuma ada satu sumber).
let activeRequestId = 0;

export const useLyricsStore = create<LyricsStoreState>((set) => ({
  phase: { kind: "loading" },
  pickCandidate: async (candidate) => {
    const path = usePlayerStore.getState().currentSong?.path;
    if (!path) return;
    // Simpan pilihan user ke cache supaya lagu ini tidak perlu dicari lagi
    await lyricsService.updateRemoteLyrics(
      path,
      candidate.syncedLyrics ?? "",
      candidate.plainLyrics ?? "",
      candidate.id,
    );
    applyLyrics(candidate.syncedLyrics, candidate.plainLyrics);
  },
}));

function applyLyrics(synced: string | null, plain: string | null) {
  if (synced && synced.trim().length > 0) {
    const lines = parseLrc(synced);
    if (lines.length > 0) {
      useLyricsStore.setState({ phase: { kind: "synced", lines } });
      return;
    }
  }
  if (plain && plain.trim().length > 0) {
    const lines = plain.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length > 0) {
      useLyricsStore.setState({ phase: { kind: "plain", lines } });
      return;
    }
  }
  useLyricsStore.setState({ phase: { kind: "empty" } });
}

function applyResult(result: LyricsLookupResult) {
  if (result.status === "cached" || result.status === "auto_matched") {
    applyLyrics(result.lyrics.synced_lyrics, result.lyrics.plain_lyrics);
  } else if (result.status === "needs_selection") {
    useLyricsStore.setState({ phase: { kind: "selecting", candidates: result.candidates } });
  } else {
    useLyricsStore.setState({ phase: { kind: "empty" } });
  }
}

function fetchLyricsFor(path: string) {
  const requestId = ++activeRequestId;
  useLyricsStore.setState({ phase: { kind: "loading" } });

  lyricsService
    .findLyricsCandidates(path)
    .then((result) => {
      if (activeRequestId !== requestId) return;
      applyResult(result);
    })
    .catch(() => {
      if (activeRequestId !== requestId) return;
      useLyricsStore.setState({ phase: { kind: "empty" } });
    });
}

// Satu-satunya pemicu fetch di seluruh app: subscribe langsung ke playerStore
// di module scope (bukan di useEffect komponen manapun). Ini yang menjamin
// "sumbernya satu" secara harfiah — nggak peduli berapa banyak widget lirik
// (Lyrics/LyricsFlipWidget/LyricsKaraokeWidget) yang mount/unmount/mount-bareng,
// listener ini cuma ada satu instance dan cuma react ke perubahan lagu.
usePlayerStore.subscribe((state, prevState) => {
  const path = state.currentSong?.path;
  const prevPath = prevState.currentSong?.path;
  if (path === prevPath) return;

  if (!path) {
    activeRequestId++; // batalkan request yang lagi jalan (kalau ada)
    useLyricsStore.setState({ phase: { kind: "empty" } });
    return;
  }

  fetchLyricsFor(path);
});

// Inisialisasi: kalau modul ini di-load saat lagu sudah ada (misal setelah
// restore state app), langsung fetch sekali tanpa nunggu event "ganti lagu".
const initialPath = usePlayerStore.getState().currentSong?.path;
if (initialPath) {
  fetchLyricsFor(initialPath);
}