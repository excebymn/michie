import { invoke } from "./api";

// Field sengaja snake_case, mengikuti konvensi field lain yang datang
// langsung dari struct Rust di project ini (lihat album_artist/disc_number
// di interface Songs, globalValues.tsx) -- bukan di-rename ke camelCase.

export interface SpectrumCurvePoint {
  hz: number;
  db: number;
}
export interface SpectrumCurve {
  points: SpectrumCurvePoint[];
}

export interface Spectrogram {
  time_cols: number;
  freq_rows: number;
  min_hz: number;
  max_hz: number;
  min_db: number;
  max_db: number;
  duration_sec: number;
  // Panjang = time_cols * freq_rows, kolom-mayor:
  // [col0_band0..col0_bandN-1, col1_band0..col1_bandN-1, ...]
  // band index 0 = frekuensi TERENDAH (lihat catatan flip di SpectrogramWidget).
  // Nilai 0-255, hasil kuantisasi dB (min_db..max_db) di backend.
  data: number[];
}

export interface Waveform {
  cols: number;
  min: number[];
  max: number[];
  rms: number[];
}

export interface StereoCorrelation {
  mono: boolean;
  cols?: number;
  correlation?: number[]; // -1..1 per kolom, cuma ada kalau mono === false
  average_correlation?: number;
}

export interface SpectralAnalysisFull {
  song_path: string;
  peak_frequency_hz: number;
  freq_min_hz: number;
  freq_max_hz: number;
  dynamic_range_db: number;
  spectral_cutoff_hz: number;
  likely_transcoded: boolean;
  analyzed_at: string;
  // JSON mentah -- pakai spectralService.parse* di bawah buat baca isinya.
  // Bisa null untuk baris lama sebelum migration dataset grafik ditambahkan.
  spectrum_curve_json: string | null;
  spectrogram_json: string | null;
  waveform_json: string | null;
  stereo_correlation_json: string | null;
}

function safeParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error("spectralService - Gagal parse JSON hasil analisis:", e);
    return null;
  }
}

export const spectralService = {
  // Baca cache dari DB. null kalau lagu ini belum pernah di-scan.
  getCached: async (songPath: string) =>
    await invoke<SpectralAnalysisFull | null>("get_spectral_analysis", {
      song_path: songPath,
    }),

  // Jalankan analisis PENUH (dipicu tombol "Scan" di widget mana pun --
  // hasilnya dipakai bareng oleh semua widget spektral untuk lagu yang sama,
  // lihat spectralStore.ts). Bisa makan waktu beberapa detik untuk lagu
  // panjang -- CPU-heavy, decode + FFT seluruh file di backend.
  analyze: async (songPath: string) =>
    await invoke<SpectralAnalysisFull>("analyze_song_spectrum", {
      song_path: songPath,
    }),

  // ---- Helper parse dataset grafik -- widget tinggal panggil ini daripada JSON.parse manual ----
  parseSpectrumCurve: (r: SpectralAnalysisFull | null | undefined) =>
    safeParse<SpectrumCurve>(r?.spectrum_curve_json),
  parseSpectrogram: (r: SpectralAnalysisFull | null | undefined) =>
    safeParse<Spectrogram>(r?.spectrogram_json),
  parseWaveform: (r: SpectralAnalysisFull | null | undefined) =>
    safeParse<Waveform>(r?.waveform_json),
  parseStereoCorrelation: (r: SpectralAnalysisFull | null | undefined) =>
    safeParse<StereoCorrelation>(r?.stereo_correlation_json),
};