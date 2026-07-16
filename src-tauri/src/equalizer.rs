use rodio::Source;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

// 10 band ISO-standar, sama seperti kebanyakan graphic EQ konsumer
// (Winamp, foobar2000, dll). Frekuensi ini FIXED — yang user ubah cuma gain.
pub const EQ_BAND_COUNT: usize = 10;
pub const EQ_FREQUENCIES: [f32; EQ_BAND_COUNT] = [
    31.0, 62.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0,
];

// Q/bandwidth tetap per band — dipilih supaya respons frekuensi antar-band
// nyambung mulus, gak ada "lubang" atau tumpuk-tindih berlebihan.
const EQ_Q: f32 = 1.2;

const MIN_GAIN_DB: f32 = -12.0;
const MAX_GAIN_DB: f32 = 12.0;

/// State gain yang di-share antara command layer (frontend lewat invoke)
/// dan audio thread (EqualizerSource yang jalan di dalam sink).
///
/// - `gains_db` dikunci lewat Mutex karena cuma diakses JARANG (user geser
///   slider sesekali), BUKAN tiap sample audio.
/// - `generation` dipakai EqualizerSource buat tau kapan HARUS baca ulang
///   gains_db dan hitung ulang koefisien biquad — dicek tiap sample lewat
///   atomic load (murah), tapi recompute betulan cuma kejadian pas ada
///   perubahan nyata, jadi gak ada lock contention di jalur audio.
pub struct EqualizerParams {
    gains_db: Mutex<[f32; EQ_BAND_COUNT]>,
    enabled: AtomicBool,
    generation: AtomicU64,
}

impl EqualizerParams {
    pub fn new() -> Self {
        Self {
            gains_db: Mutex::new([0.0; EQ_BAND_COUNT]),
            enabled: AtomicBool::new(true),
            generation: AtomicU64::new(0),
        }
    }

    /// Dipanggil sekali saat app boot untuk restore dari DB.
    pub fn restore(&self, gains: [f32; EQ_BAND_COUNT], enabled: bool) {
        if let Ok(mut g) = self.gains_db.lock() {
            *g = gains;
        }
        self.enabled.store(enabled, Ordering::Relaxed);
        self.generation.fetch_add(1, Ordering::Relaxed);
    }

    pub fn set_band_gain(&self, band: usize, gain_db: f32) -> Result<(), String> {
        if band >= EQ_BAND_COUNT {
            return Err("band index out of range".to_string());
        }
        let clamped = gain_db.clamp(MIN_GAIN_DB, MAX_GAIN_DB);
        if let Ok(mut g) = self.gains_db.lock() {
            g[band] = clamped;
        }
        self.generation.fetch_add(1, Ordering::Relaxed);
        Ok(())
    }

    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::Relaxed);
        self.generation.fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_gains(&self) -> [f32; EQ_BAND_COUNT] {
        self.gains_db
            .lock()
            .map(|g| *g)
            .unwrap_or([0.0; EQ_BAND_COUNT])
    }

    pub fn get_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }
}

/// Snapshot satu band buat dikirim ke frontend (nama field cocok sama
/// konvensi camelCase via serde di command layer).
#[derive(serde::Serialize, Clone, Copy)]
pub struct EqBandInfo {
    pub frequency: f32,
    pub gain_db: f32,
}

pub fn get_all_bands(params: &EqualizerParams) -> Vec<EqBandInfo> {
    let gains = params.get_gains();
    (0..EQ_BAND_COUNT)
        .map(|i| EqBandInfo {
            frequency: EQ_FREQUENCIES[i],
            gain_db: gains[i],
        })
        .collect()
}

/// Koefisien satu biquad peaking filter (RBJ Audio EQ Cookbook), sudah
/// dinormalisasi terhadap a0 (jadi cuma perlu simpan b0/b1/b2/a1/a2).
#[derive(Clone, Copy)]
struct BiquadCoeffs {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
}

impl BiquadCoeffs {
    fn peaking(freq: f32, q: f32, gain_db: f32, sample_rate: f32) -> Self {
        let a = 10f32.powf(gain_db / 40.0);
        let w0 = 2.0 * std::f32::consts::PI * freq / sample_rate;
        let alpha = w0.sin() / (2.0 * q);
        let cos_w0 = w0.cos();

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos_w0;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos_w0;
        let a2 = 1.0 - alpha / a;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
        }
    }
}

// State internal Direct Form II Transposed — 2 nilai per band per channel.
#[derive(Clone, Copy, Default)]
struct BiquadState {
    z1: f32,
    z2: f32,
}

/// Wrapper Source yang menerapkan 10-band graphic EQ ke sample sebelum
/// diteruskan ke tahap berikutnya.
///
/// Urutan chaining yang benar di `load_song`:
///   decoder -> EqualizerSource -> TapSource -> sink
/// (visualizer jadi nampilin suara yang SUDAH di-EQ — sesuai yang beneran
/// didengar user, bukan sinyal mentah sebelum diproses.)
pub struct EqualizerSource<S> {
    inner: S,
    params: Arc<EqualizerParams>,
    channels: u16,
    sample_rate: u32,
    coeffs: [BiquadCoeffs; EQ_BAND_COUNT],
    // Satu set state filter per channel, masing-masing punya state per band.
    filter_state: Vec<[BiquadState; EQ_BAND_COUNT]>,
    channel_pos: u16,
    last_seen_generation: u64,
}

impl<S> EqualizerSource<S>
where
    S: Source<Item = f32>,
{
    pub fn new(inner: S, params: Arc<EqualizerParams>) -> Self {
        let channels = inner.channels();
        let sample_rate = inner.sample_rate();
        let gains = params.get_gains();
        let coeffs = Self::compute_coeffs(&gains, sample_rate as f32);
        let generation = params.generation.load(Ordering::Relaxed);

        Self {
            inner,
            params,
            channels,
            sample_rate,
            coeffs,
            filter_state: vec![[BiquadState::default(); EQ_BAND_COUNT]; channels.max(1) as usize],
            channel_pos: 0,
            last_seen_generation: generation,
        }
    }

    fn compute_coeffs(
        gains: &[f32; EQ_BAND_COUNT],
        sample_rate: f32,
    ) -> [BiquadCoeffs; EQ_BAND_COUNT] {
        let mut out = [BiquadCoeffs::peaking(EQ_FREQUENCIES[0], EQ_Q, gains[0], sample_rate);
            EQ_BAND_COUNT];
        for i in 0..EQ_BAND_COUNT {
            out[i] = BiquadCoeffs::peaking(EQ_FREQUENCIES[i], EQ_Q, gains[i], sample_rate);
        }
        out
    }

    fn maybe_refresh_coeffs(&mut self) {
        let current_gen = self.params.generation.load(Ordering::Relaxed);
        if current_gen != self.last_seen_generation {
            let gains = self.params.get_gains();
            self.coeffs = Self::compute_coeffs(&gains, self.sample_rate as f32);
            self.last_seen_generation = current_gen;
        }
    }

    fn process(&mut self, channel: usize, input: f32) -> f32 {
        let mut sample = input;
        let state = &mut self.filter_state[channel];
        for band in 0..EQ_BAND_COUNT {
            let c = &self.coeffs[band];
            let s = &mut state[band];
            // Direct Form II Transposed
            let y = c.b0 * sample + s.z1;
            s.z1 = c.b1 * sample - c.a1 * y + s.z2;
            s.z2 = c.b2 * sample - c.a2 * y;
            sample = y;
        }
        sample
    }
}

impl<S> Iterator for EqualizerSource<S>
where
    S: Source<Item = f32>,
{
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let sample = self.inner.next()?;
        let channels = self.channels.max(1);

        if !self.params.get_enabled() {
            // Bypass total kalau EQ dimatikan — hemat CPU sepenuhnya.
            self.channel_pos = (self.channel_pos + 1) % channels;
            return Some(sample);
        }

        self.maybe_refresh_coeffs();

        let channel = self.channel_pos as usize;
        self.channel_pos = (self.channel_pos + 1) % channels;

        Some(self.process(channel, sample))
    }
}

impl<S> Source for EqualizerSource<S>
where
    S: Source<Item = f32>,
{
    fn current_span_len(&self) -> Option<usize> {
        self.inner.current_span_len()
    }
    fn channels(&self) -> u16 {
        self.inner.channels()
    }
    fn sample_rate(&self) -> u32 {
        self.inner.sample_rate()
    }
    fn total_duration(&self) -> Option<Duration> {
        self.inner.total_duration()
    }

    // Reset state filter tiap kali seek berhasil, biar gak ada transient/klik
    // dari feedback z1/z2 sample lama yang "nyangkut" setelah lompat posisi.
    fn try_seek(&mut self, pos: Duration) -> Result<(), rodio::source::SeekError> {
        let result = self.inner.try_seek(pos);
        if result.is_ok() {
            for ch in self.filter_state.iter_mut() {
                *ch = [BiquadState::default(); EQ_BAND_COUNT];
            }
        }
        result
    }
}

// ============================================================
// Bagian di bawah ini: DB persistence + command layer.
// Disatukan di sini (bukan di db.rs/commands.rs) mengikuti pola yang sama
// dengan lyrics.rs — satu file berisi seluruh logika satu fitur.
// ============================================================

use crate::AppState;
use sqlx::{Pool, Sqlite};
use tauri::State;

#[derive(sqlx::FromRow)]
struct EqBandRow {
    band_index: i64,
    gain_db: f64,
}

/// Dipanggil SEKALI saat app boot (lib.rs, sebelum MusicPlayer dibuat) untuk
/// restore gain + status enabled ke EqualizerParams in-memory. BUKAN
/// #[tauri::command] — bukan dipanggil dari frontend, tapi langsung dari Rust
/// saat startup, karena EQ harus sudah aktif SEBELUM lagu pertama diputar.
pub async fn load_equalizer_state(pool: &Pool<Sqlite>) -> Result<([f32; EQ_BAND_COUNT], bool), String> {
    let rows: Vec<EqBandRow> = sqlx::query_as::<_, EqBandRow>(
        "SELECT band_index, gain_db FROM equalizer_bands ORDER BY band_index ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error loading equalizer bands: {}", e))?;

    let mut gains = [0.0f32; EQ_BAND_COUNT];
    for row in rows {
        let idx = row.band_index as usize;
        if idx < EQ_BAND_COUNT {
            gains[idx] = row.gain_db as f32;
        }
    }

    let enabled: (bool,) = sqlx::query_as("SELECT enabled FROM equalizer_settings WHERE id = 1")
        .fetch_one(pool)
        .await
        .unwrap_or((true,));

    Ok((gains, enabled.0))
}

async fn persist_band_gain(pool: &Pool<Sqlite>, band_index: usize, gain_db: f32) -> Result<(), String> {
    sqlx::query("UPDATE equalizer_bands SET gain_db = ?1 WHERE band_index = ?2")
        .bind(gain_db)
        .bind(band_index as i64)
        .execute(pool)
        .await
        .map_err(|e| format!("Error saving equalizer band gain: {}", e))?;
    Ok(())
}

async fn persist_enabled(pool: &Pool<Sqlite>, enabled: bool) -> Result<(), String> {
    sqlx::query("UPDATE equalizer_settings SET enabled = ?1 WHERE id = 1")
        .bind(enabled)
        .execute(pool)
        .await
        .map_err(|e| format!("Error saving equalizer enabled state: {}", e))?;
    Ok(())
}

// ----------------- Commands (dipanggil dari frontend lewat invoke()) -----------------

// State in-memory (EqualizerParams) adalah sumber kebenaran saat runtime,
// jadi baca langsung dari situ — TIDAK query DB tiap kali frontend minta
// data band (DB cuma dipakai buat restore saat boot & persist saat berubah).
#[tauri::command(rename_all = "snake_case")]
pub fn get_eq_bands(state: State<AppState, '_>) -> Result<Vec<EqBandInfo>, String> {
    Ok(get_all_bands(&state.equalizer_params))
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_eq_enabled(state: State<AppState, '_>) -> Result<bool, String> {
    Ok(state.equalizer_params.get_enabled())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_eq_band_gain(
    state: State<AppState, '_>,
    band_index: usize,
    gain_db: f32,
) -> Result<(), String> {
    // Update in-memory dulu — EqualizerSource di audio thread bakal
    // ke-refresh koefisiennya di sample berikutnya lewat generation counter.
    state.equalizer_params.set_band_gain(band_index, gain_db)?;
    // Baru persist ke DB, biar ke-restore lagi pas app dibuka ulang.
    persist_band_gain(&state.pool, band_index, gain_db).await?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_eq_enabled(state: State<AppState, '_>, enabled: bool) -> Result<(), String> {
    state.equalizer_params.set_enabled(enabled);
    persist_enabled(&state.pool, enabled).await?;
    Ok(())
}