// ---------------------------------------- Fitur Analisis Spektral ----------------------------------------
//
// Semua logika widget-widget "Analisis Spektral" (Peak Frequency / Frequency
// Range / Dynamic Range / Spectral Cutoff, + grafik: Spectrogram, Kurva
// Spektrum, Waveform, Stereo Correlation) disatukan di sini -- pola sama
// seperti equalizer.rs & lyrics.rs: satu file berdiri sendiri per fitur,
// supaya commands.rs/db.rs tidak makin gemuk.
//
// PENTING -- SATU SCAN UNTUK SEMUA WIDGET:
// analyze_song_spectrum() decode file SEKALI dan jalanin SATU loop STFT yang
// sekaligus menghasilkan seluruh dataset (metrik skalar + 4 dataset grafik).
// Ini SENGAJA digabung jadi satu command, bukan 4 command terpisah per
// grafik -- supaya kalau user buka beberapa widget grafik buat lagu yang
// sama, gak ada decode+FFT berulang kali untuk file yang sama. Semua widget
// baca dari baris cache yang sama di tabel spectral_analysis -> otomatis
// tersinkron (lihat spectralStore.ts di frontend).
//
// ALUR:
//   1. Widget dibuka -> panggil get_spectral_analysis(song_path) -> baca
//      cache. None kalau lagu ini belum pernah di-scan sama sekali.
//   2. User pencet tombol "Scan" (di widget MANAPUN) -> panggil
//      analyze_song_spectrum(song_path).
//   3. Command ini decode SELURUH file + jalanin STFT di thread blocking
//      terpisah (tokio::spawn_blocking) supaya command Tauri lain (playback,
//      dsb) tetap responsif selagi analisis jalan.
//   4. Hasil (skalar + JSON dataset grafik) di-upsert ke satu baris di tabel
//      spectral_analysis, lalu dibaca ulang & di-return ke frontend.
//
// SENGAJA tidak dipanggil otomatis dari scan_directory() di lib.rs -- ini CPU
// intensif dan cuma perlu jalan kalau user beneran minta lewat tombol.
//
// CATATAN SOAL "GANTI LAGU SAAT SCAN BELUM SELESAI":
// Command ini TIDAK terikat ke "lagu yang sedang diputar sekarang" -- dia
// terikat ke song_path yang dikirim SAAT tombol dipencet. Kalau user ganti
// lagu di tengah proses, thread blocking di backend ini TETAP jalan sampai
// selesai dan tetap nyimpen hasilnya ke baris song_path yang ORIGINAL (bukan
// lagu yang sekarang lagi diputar). Kalau user balik lagi ke lagu itu nanti,
// hasilnya sudah ada di cache. Satu-satunya kondisi hasil ini hilang adalah
// kalau aplikasi ditutup sebelum analisis selesai (thread ikut mati bareng
// proses) -- di kondisi itu user perlu pencet Scan lagi.

use rodio::{Decoder, Source};
use rustfft::{num_complex::Complex32, FftPlanner};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use tauri::State;

use crate::AppState;

// ---------------------------------------- Konstanta ----------------------------------------

// STFT: 4096 sample @44.1kHz ~= 93ms per frame, cukup presisi buat bedain
// pita frekuensi tapi masih ringan dihitung ribuan kali. Hop 50% (overlap).
const FFT_SIZE: usize = 4096;
const HOP_SIZE: usize = FFT_SIZE / 2;

const MIN_ANALYSIS_HZ: f64 = 20.0;

// Ambang batas (dB, relatif ke bin/band terkuat) buat nentuin "masih
// dianggap ada sinyal" saat nyari batas bawah/atas Frequency Range.
const RANGE_THRESHOLD_DB: f64 = -60.0;

// Ambang & jumlah bin "sustained" buat deteksi tebing high-frequency cutoff
// (indikasi file hasil transcode dari sumber lossy).
const CUTOFF_THRESHOLD_DB: f64 = -45.0;
const SUSTAIN_CHECK_BINS: usize = 5;

// -------- Kurva Spektrum (garis tunggal, rata-rata sepanjang lagu) --------
const SPECTRUM_CURVE_POINTS: usize = 200;

// -------- Spectrogram (waterfall time x frekuensi) --------
// Ukuran ini dikuantisasi ke u8 (0-255) sebelum disimpan sebagai JSON supaya
// payload-nya gak bengkak -- 240x96 = 23.040 angka per lagu, cukup detail
// buat kelihatan pola cutoff-nya tapi tetap ringan disimpan/dikirim ke UI.
const SPECTROGRAM_TIME_COLS: usize = 240;
const SPECTROGRAM_FREQ_ROWS: usize = 96;
const SPECTROGRAM_MIN_DB: f64 = -90.0;
const SPECTROGRAM_MAX_DB: f64 = 0.0;

// -------- Waveform / Loudness over time --------
const WAVEFORM_COLS: usize = 800;

// -------- Stereo correlation over time --------
const STEREO_CORRELATION_COLS: usize = 300;

#[derive(sqlx::FromRow, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SpectralAnalysis {
    pub song_path: String,
    pub peak_frequency_hz: f64,
    pub freq_min_hz: f64,
    pub freq_max_hz: f64,
    pub dynamic_range_db: f64,
    pub spectral_cutoff_hz: f64,
    pub likely_transcoded: bool,
    pub analyzed_at: String,
    // Semua field di bawah ini nullable: baris lama (sebelum migration
    // 0007_spectral_analysis_charts.sql) belum punya dataset grafik sampai
    // user pencet "Scan Ulang". Masing-masing berupa JSON string mentah --
    // frontend yang parse (lihat spectralService.ts), supaya struct Rust ini
    // gak perlu tau bentuk detail tiap dataset.
    #[sqlx(default)]
    pub spectrum_curve_json: Option<String>,
    #[sqlx(default)]
    pub spectrogram_json: Option<String>,
    #[sqlx(default)]
    pub waveform_json: Option<String>,
    #[sqlx(default)]
    pub stereo_correlation_json: Option<String>,
}

// ---------------------------------------- Commands ----------------------------------------

/// Baca hasil analisis yang sudah di-cache di DB untuk satu lagu.
/// Return None kalau lagu ini belum pernah di-scan -> widget nampilin tombol "Scan".
#[tauri::command(rename_all = "snake_case")]
pub async fn get_spectral_analysis(
    state: State<AppState, '_>,
    song_path: String,
) -> Result<Option<SpectralAnalysis>, String> {
    sqlx::query_as::<_, SpectralAnalysis>(
        "SELECT song_path, peak_frequency_hz, freq_min_hz, freq_max_hz, \
                dynamic_range_db, spectral_cutoff_hz, likely_transcoded, analyzed_at, \
                spectrum_curve_json, spectrogram_json, waveform_json, stereo_correlation_json \
         FROM spectral_analysis WHERE song_path = $1",
    )
    .bind(&song_path)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

/// Jalankan analisis spektral PENUH untuk satu file (dipicu tombol "Scan" di
/// widget mana pun -- hasilnya dipakai bareng oleh semua widget grafik).
/// CPU-heavy -> didorong ke spawn_blocking, JANGAN dipanggil dari
/// loop/watcher otomatis manapun.
#[tauri::command(rename_all = "snake_case")]
pub async fn analyze_song_spectrum(
    state: State<AppState, '_>,
    song_path: String,
) -> Result<SpectralAnalysis, String> {
    let path_for_blocking = song_path.clone();
    let result = tokio::task::spawn_blocking(move || run_analysis(&path_for_blocking))
        .await
        .map_err(|e| format!("Analisis spektral gagal (task panic): {}", e))??;

    // Upsert ke DB -- pola sama seperti lyrics.rs (ON CONFLICT DO UPDATE).
    // analyzed_at sengaja dihitung SQLite (datetime('now')) bukan di Rust,
    // konsisten sama kolom TEXT default lain di project ini.
    sqlx::query(
        "INSERT INTO spectral_analysis
            (song_path, peak_frequency_hz, freq_min_hz, freq_max_hz,
             dynamic_range_db, spectral_cutoff_hz, likely_transcoded,
             spectrum_curve_json, spectrogram_json, waveform_json, stereo_correlation_json,
             analyzed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, datetime('now'))
         ON CONFLICT(song_path) DO UPDATE SET
            peak_frequency_hz = excluded.peak_frequency_hz,
            freq_min_hz = excluded.freq_min_hz,
            freq_max_hz = excluded.freq_max_hz,
            dynamic_range_db = excluded.dynamic_range_db,
            spectral_cutoff_hz = excluded.spectral_cutoff_hz,
            likely_transcoded = excluded.likely_transcoded,
            spectrum_curve_json = excluded.spectrum_curve_json,
            spectrogram_json = excluded.spectrogram_json,
            waveform_json = excluded.waveform_json,
            stereo_correlation_json = excluded.stereo_correlation_json,
            analyzed_at = excluded.analyzed_at",
    )
    .bind(&result.song_path)
    .bind(result.peak_frequency_hz)
    .bind(result.freq_min_hz)
    .bind(result.freq_max_hz)
    .bind(result.dynamic_range_db)
    .bind(result.spectral_cutoff_hz)
    .bind(result.likely_transcoded)
    .bind(&result.spectrum_curve_json)
    .bind(&result.spectrogram_json)
    .bind(&result.waveform_json)
    .bind(&result.stereo_correlation_json)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    get_spectral_analysis(state, result.song_path.clone())
        .await?
        .ok_or_else(|| "Gagal membaca hasil analisis yang baru disimpan".to_string())
}

// ---------------------------------------- Helper: pemetaan bin FFT (linear) -> band (log-spaced) ----------------------------------------
//
// Dipakai buat 2 kebutuhan: (1) reduksi kurva spektrum (200 titik) dari
// avg_magnitude yang sudah dirata-rata sepanjang lagu, dan (2) reduksi tiap
// baris spectrogram (96 band) per-frame di dalam loop STFT. Precompute
// sekali di luar loop supaya per-frame tinggal lookup array O(bin_count),
// bukan hitung ulang O(bin_count * num_bands) tiap frame.

fn log_band_edges(min_hz: f64, max_hz: f64, num_bands: usize) -> Vec<(f64, f64)> {
    let log_min = min_hz.max(1.0).ln();
    let log_max = max_hz.max(min_hz + 1.0).ln();
    (0..num_bands)
        .map(|i| {
            let lo = (log_min + (log_max - log_min) * i as f64 / num_bands as f64).exp();
            let hi = (log_min + (log_max - log_min) * (i + 1) as f64 / num_bands as f64).exp();
            (lo, hi)
        })
        .collect()
}

fn precompute_bin_to_band(bin_count: usize, hz_per_bin: f64, edges: &[(f64, f64)]) -> Vec<Option<usize>> {
    (0..bin_count)
        .map(|bin| {
            let hz = bin as f64 * hz_per_bin;
            edges.iter().position(|&(lo, hi)| hz >= lo && hz < hi)
        })
        .collect()
}

fn band_bin_counts(bin_to_band: &[Option<usize>], num_bands: usize) -> Vec<usize> {
    let mut counts = vec![0usize; num_bands];
    for b in bin_to_band.iter().flatten() {
        counts[*b] += 1;
    }
    counts
}

fn reduce_bins_to_bands(values: &[f64], bin_to_band: &[Option<usize>], band_counts: &[usize]) -> Vec<f64> {
    let mut sums = vec![0.0f64; band_counts.len()];
    for (bin, &v) in values.iter().enumerate() {
        if let Some(band) = bin_to_band[bin] {
            sums[band] += v;
        }
    }
    sums.iter()
        .zip(band_counts.iter())
        .map(|(&s, &c)| if c > 0 { s / c as f64 } else { 0.0 })
        .collect()
}

fn quantize_db(db: f64) -> u8 {
    let clamped = db.clamp(SPECTROGRAM_MIN_DB, SPECTROGRAM_MAX_DB);
    let normalized = (clamped - SPECTROGRAM_MIN_DB) / (SPECTROGRAM_MAX_DB - SPECTROGRAM_MIN_DB);
    (normalized * 255.0).round() as u8
}

// ---------------------------------------- Helper: waveform & stereo correlation ----------------------------------------

/// Downsample sample mono jadi `cols` kolom, masing-masing berisi (min, max, rms)
/// -- pola umum envelope waveform di DAW/media player.
fn downsample_waveform(mono: &[f32], cols: usize) -> (Vec<f32>, Vec<f32>, Vec<f32>) {
    let n = mono.len();
    let bucket = (n / cols).max(1);
    let mut mins = Vec::with_capacity(cols);
    let mut maxs = Vec::with_capacity(cols);
    let mut rms = Vec::with_capacity(cols);

    for col in 0..cols {
        let start = col * bucket;
        if start >= n {
            mins.push(0.0);
            maxs.push(0.0);
            rms.push(0.0);
            continue;
        }
        let end = if col == cols - 1 { n } else { ((col + 1) * bucket).min(n) };
        let slice = &mono[start..end];
        let mn = slice.iter().cloned().fold(f32::INFINITY, f32::min);
        let mx = slice.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let sum_sq: f64 = slice.iter().map(|&s| (s as f64) * (s as f64)).sum();
        let r = (sum_sq / (slice.len().max(1) as f64)).sqrt() as f32;
        mins.push(mn);
        maxs.push(mx);
        rms.push(r);
    }

    (mins, maxs, rms)
}

/// Korelasi Pearson-style antara channel kiri & kanan, per-kolom (downsampled)
/// -- 1.0 = mono-compatible/in-phase penuh, 0 = decorrelated/lebar, negatif =
/// ada masalah fase (bisa hilang kalau di-mono-kan).
fn downsample_correlation(left: &[f32], right: &[f32], cols: usize) -> Vec<f32> {
    let n = left.len().min(right.len());
    let bucket = (n / cols).max(1);
    let mut out = Vec::with_capacity(cols);

    for col in 0..cols {
        let start = col * bucket;
        if start >= n {
            out.push(0.0);
            continue;
        }
        let end = if col == cols - 1 { n } else { ((col + 1) * bucket).min(n) };
        let (corr, _, _) = correlation_stats(&left[start..end], &right[start..end]);
        out.push(corr);
    }

    out
}

fn correlation_stats(l: &[f32], r: &[f32]) -> (f32, f64, f64) {
    let n = l.len().min(r.len());
    let mut sum_lr = 0.0f64;
    let mut sum_l2 = 0.0f64;
    let mut sum_r2 = 0.0f64;
    for i in 0..n {
        sum_lr += (l[i] as f64) * (r[i] as f64);
        sum_l2 += (l[i] as f64) * (l[i] as f64);
        sum_r2 += (r[i] as f64) * (r[i] as f64);
    }
    let denom = (sum_l2 * sum_r2).sqrt().max(1e-12);
    ((sum_lr / denom).clamp(-1.0, 1.0) as f32, sum_l2, sum_r2)
}

// ---------------------------------------- Inti analisis (sync, jalan di blocking thread) ----------------------------------------

fn run_analysis(song_path: &str) -> Result<SpectralAnalysis, String> {
    if !Path::new(song_path).exists() {
        return Err(format!("File tidak ditemukan: {}", song_path));
    }

    let file = File::open(song_path).map_err(|e| format!("Gagal membuka file: {}", e))?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader).map_err(|e| format!("Gagal decode audio: {}", e))?;

    // Rodio 0.21+ bekerja dengan sample f32 (-1.0..=1.0) untuk semua format.
    let sample_rate = source.sample_rate();
    let channels = (source.channels() as usize).max(1);

    // Decode sekali, simpan mono (buat FFT & waveform) + left/right terpisah
    // (buat stereo correlation, cuma kalau file-nya beneran stereo).
    let mut mono: Vec<f32> = Vec::new();
    let mut left: Vec<f32> = Vec::new();
    let mut right: Vec<f32> = Vec::new();
    let mut frame_buf = vec![0.0f32; channels];
    let mut frame_fill = 0usize;

    for sample in source {
        frame_buf[frame_fill] = sample;
        frame_fill += 1;
        if frame_fill == channels {
            let l = frame_buf[0];
            let m: f32 = frame_buf.iter().sum::<f32>() / channels as f32;
            left.push(l);
            if channels >= 2 {
                right.push(frame_buf[1]);
            }
            mono.push(m);
            frame_fill = 0;
        }
    }

    if mono.is_empty() {
        return Err("Tidak ada sample audio yang bisa dibaca dari file ini".to_string());
    }

    let is_stereo = channels >= 2 && !right.is_empty();

    // -------- Dynamic Range --------
    // Pendekatan sederhana ala mini "DR meter": selisih antara peak amplitude
    // dan RMS (loudness rata-rata) sepanjang lagu, dalam dB.
    let peak_amplitude = mono.iter().fold(0.0f32, |m, &s| m.max(s.abs())).max(1e-9);
    let sum_sq: f64 = mono.iter().map(|&s| (s as f64) * (s as f64)).sum();
    let rms = ((sum_sq / mono.len() as f64).sqrt()).max(1e-9);
    let dynamic_range_db = 20.0 * ((peak_amplitude as f64) / rms).log10();

    // -------- STFT: satu loop, hasilnya dipakai buat metrik skalar SEKALIGUS spectrogram --------
    let bin_count = FFT_SIZE / 2;
    let hz_per_bin = sample_rate as f64 / FFT_SIZE as f64;
    let nyquist = sample_rate as f64 / 2.0;

    let total_frames = if mono.len() < FFT_SIZE {
        0
    } else {
        (mono.len() - FFT_SIZE) / HOP_SIZE + 1
    };
    if total_frames == 0 {
        return Err("File terlalu pendek untuk dianalisis (kurang dari satu frame FFT)".to_string());
    }

    let spectrogram_edges = log_band_edges(MIN_ANALYSIS_HZ, nyquist, SPECTROGRAM_FREQ_ROWS);
    let spectrogram_bin_to_band = precompute_bin_to_band(bin_count, hz_per_bin, &spectrogram_edges);
    let spectrogram_band_counts = band_bin_counts(&spectrogram_bin_to_band, SPECTROGRAM_FREQ_ROWS);

    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(FFT_SIZE);
    let window: Vec<f32> = (0..FFT_SIZE)
        .map(|i| 0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE as f32 - 1.0)).cos())
        .collect();

    let mut avg_magnitude = vec![0.0f64; bin_count];
    let mut spectrogram_sum = vec![0.0f64; SPECTROGRAM_TIME_COLS * SPECTROGRAM_FREQ_ROWS];
    let mut spectrogram_count = vec![0u32; SPECTROGRAM_TIME_COLS];

    let mut buffer = vec![Complex32::new(0.0, 0.0); FFT_SIZE];
    let mut frame_linear = vec![0.0f64; bin_count];

    let mut frame_idx = 0usize;
    let mut pos = 0usize;
    while pos + FFT_SIZE <= mono.len() {
        for i in 0..FFT_SIZE {
            buffer[i] = Complex32::new(mono[pos + i] * window[i], 0.0);
        }
        fft.process(&mut buffer);

        for bin in 0..bin_count {
            let mag = buffer[bin].norm() as f64;
            avg_magnitude[bin] += mag;
            frame_linear[bin] = mag;
        }

        let row = reduce_bins_to_bands(&frame_linear, &spectrogram_bin_to_band, &spectrogram_band_counts);
        let col = ((frame_idx * SPECTROGRAM_TIME_COLS) / total_frames).min(SPECTROGRAM_TIME_COLS - 1);
        for band in 0..SPECTROGRAM_FREQ_ROWS {
            spectrogram_sum[col * SPECTROGRAM_FREQ_ROWS + band] += row[band];
        }
        spectrogram_count[col] += 1;

        frame_idx += 1;
        pos += HOP_SIZE;
    }

    for v in avg_magnitude.iter_mut() {
        *v /= total_frames as f64;
    }

    // -------- Peak Frequency --------
    let (peak_bin, &peak_mag_raw) = avg_magnitude
        .iter()
        .enumerate()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
        .unwrap();
    let peak_frequency_hz = peak_bin as f64 * hz_per_bin;
    let peak_mag = peak_mag_raw.max(1e-12);
    let rel_db = |mag: f64| 20.0 * (mag.max(1e-12) / peak_mag).log10();

    // -------- Frequency Range --------
    let freq_min_bin = (0..bin_count)
        .find(|&bin| rel_db(avg_magnitude[bin]) >= RANGE_THRESHOLD_DB)
        .unwrap_or(0);
    let freq_max_bin = (0..bin_count)
        .rev()
        .find(|&bin| rel_db(avg_magnitude[bin]) >= RANGE_THRESHOLD_DB)
        .unwrap_or(bin_count - 1);
    let freq_min_hz = freq_min_bin as f64 * hz_per_bin;
    let freq_max_hz = freq_max_bin as f64 * hz_per_bin;

    // -------- Spectral Cutoff --------
    let spectral_cutoff_bin = (0..bin_count)
        .rev()
        .find(|&bin| {
            let window_end = (bin + SUSTAIN_CHECK_BINS).min(bin_count);
            (bin..window_end).all(|b| rel_db(avg_magnitude[b]) >= CUTOFF_THRESHOLD_DB)
        })
        .unwrap_or(bin_count - 1);
    let spectral_cutoff_hz = spectral_cutoff_bin as f64 * hz_per_bin;

    let likely_transcoded = spectral_cutoff_hz < nyquist * 0.9 && spectral_cutoff_hz < 21_000.0;

    // -------- Kurva Spektrum (200 titik log-spaced) --------
    let curve_edges = log_band_edges(MIN_ANALYSIS_HZ, nyquist, SPECTRUM_CURVE_POINTS);
    let curve_bin_to_band = precompute_bin_to_band(bin_count, hz_per_bin, &curve_edges);
    let curve_band_counts = band_bin_counts(&curve_bin_to_band, SPECTRUM_CURVE_POINTS);
    let curve_values = reduce_bins_to_bands(&avg_magnitude, &curve_bin_to_band, &curve_band_counts);

    let spectrum_curve_json = {
        let points: Vec<serde_json::Value> = curve_values
            .iter()
            .enumerate()
            .map(|(i, &mag)| {
                let (lo, hi) = curve_edges[i];
                let hz = (lo * hi).sqrt(); // titik tengah geometris band log
                serde_json::json!({ "hz": hz, "db": rel_db(mag) })
            })
            .collect();
        serde_json::json!({ "points": points }).to_string()
    };

    // -------- Spectrogram (kuantisasi ke u8, forward-fill kolom kosong) --------
    let spectrogram_json = {
        let mut data: Vec<u8> = Vec::with_capacity(SPECTROGRAM_TIME_COLS * SPECTROGRAM_FREQ_ROWS);
        let mut last_col = vec![SPECTROGRAM_MIN_DB; SPECTROGRAM_FREQ_ROWS];
        for col in 0..SPECTROGRAM_TIME_COLS {
            let count = spectrogram_count[col];
            let col_db = if count > 0 {
                let v: Vec<f64> = (0..SPECTROGRAM_FREQ_ROWS)
                    .map(|band| rel_db(spectrogram_sum[col * SPECTROGRAM_FREQ_ROWS + band] / count as f64))
                    .collect();
                last_col = v.clone();
                v
            } else {
                // Lagu terlalu pendek buat ngisi semua 240 kolom -> forward-fill
                // dari kolom terakhir yang ada isinya, biar gak ada "lubang hitam".
                last_col.clone()
            };
            for band in 0..SPECTROGRAM_FREQ_ROWS {
                data.push(quantize_db(col_db[band]));
            }
        }
        serde_json::json!({
            "time_cols": SPECTROGRAM_TIME_COLS,
            "freq_rows": SPECTROGRAM_FREQ_ROWS,
            "min_hz": MIN_ANALYSIS_HZ,
            "max_hz": nyquist,
            "min_db": SPECTROGRAM_MIN_DB,
            "max_db": SPECTROGRAM_MAX_DB,
            "duration_sec": mono.len() as f64 / sample_rate as f64,
            "data": data,
        })
        .to_string()
    };

    // -------- Waveform / Loudness over time --------
    let (wf_min, wf_max, wf_rms) = downsample_waveform(&mono, WAVEFORM_COLS);
    let waveform_json = serde_json::json!({
        "cols": WAVEFORM_COLS,
        "min": wf_min,
        "max": wf_max,
        "rms": wf_rms,
    })
    .to_string();

    // -------- Stereo Correlation --------
    let stereo_correlation_json = if is_stereo {
        let per_col = downsample_correlation(&left, &right, STEREO_CORRELATION_COLS);
        let (overall, _, _) = correlation_stats(&left, &right);
        serde_json::json!({
            "mono": false,
            "cols": STEREO_CORRELATION_COLS,
            "correlation": per_col,
            "average_correlation": overall,
        })
        .to_string()
    } else {
        serde_json::json!({ "mono": true }).to_string()
    };

    Ok(SpectralAnalysis {
        song_path: song_path.to_string(),
        peak_frequency_hz,
        freq_min_hz,
        freq_max_hz,
        dynamic_range_db,
        spectral_cutoff_hz,
        likely_transcoded,
        analyzed_at: String::new(), // diisi ulang dari DB setelah upsert, lihat analyze_song_spectrum
        spectrum_curve_json: Some(spectrum_curve_json),
        spectrogram_json: Some(spectrogram_json),
        waveform_json: Some(waveform_json),
        stereo_correlation_json: Some(stereo_correlation_json),
    })
}