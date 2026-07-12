use rodio::Source;
use rustfft::{num_complex::Complex, Fft, FftPlanner};
use std::collections::VecDeque;
use std::sync::atomic::Ordering;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;

// ---- Subscriber gating ----
// Backend gak perlu (dan gak boleh) ngitung FFT + emit kalau gak ada satupun
// widget frontend yang lagi nampilin hasilnya. Frontend "daftar" lewat command
// di bawah ini pas listener pertama nempel, dan "keluar" pas listener
// terakhir lepas — thread analyzer di lib.rs tinggal cek counter ini tiap
// iterasi sebelum kerja apa-apa.

#[tauri::command]
pub fn visualizer_subscribe(state: tauri::State<'_, crate::AppState>) {
    state.visualizer_subscribers.fetch_add(1, Ordering::Relaxed);
}

#[tauri::command]
pub fn visualizer_unsubscribe(state: tauri::State<'_, crate::AppState>) {
    // saturating: kalau ke-panggil lebih banyak dari subscribe (mis. race
    // kondisi di frontend), gak boleh underflow ke angka raksasa.
    let _ = state
        .visualizer_subscribers
        .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |v| {
            Some(v.saturating_sub(1))
        });
}

// Ukuran window FFT (harus pangkat 2). 1024 sample @ 44.1kHz ~= 23ms per window —
// cukup responsif buat ngikutin beat tanpa kelihatan "gerigi".
const FFT_SIZE: usize = 1024;
const RING_CAPACITY: usize = FFT_SIZE * 2;

// Jumlah bar visualizer — tinggal ubah angka ini kalau mau ganti jumlah bar
pub const BAND_COUNT: usize = 20;
const MIN_FREQ: f32 = 20.0; // batas bawah audible
const MAX_FREQ: f32 = 16000.0; // batas atas yang relevan untuk musik

pub type VisualizerBuffer = Arc<Mutex<VecDeque<f32>>>;

pub fn new_buffer() -> VisualizerBuffer {
    Arc::new(Mutex::new(VecDeque::with_capacity(RING_CAPACITY)))
}

/// Wrapper Source yang "menyadap" sample sebelum diteruskan ke sink —
/// audio yang didengar user sama sekali tidak berubah.
pub struct TapSource<S> {
    inner: S,
    buffer: VisualizerBuffer,
    channels: u16,
    frame_acc: f32,
    frame_pos: u16,
}

impl<S> TapSource<S>
where
    S: Source<Item = f32>,
{
    pub fn new(inner: S, buffer: VisualizerBuffer) -> Self {
        let channels = inner.channels();
        Self {
            inner,
            buffer,
            channels,
            frame_acc: 0.0,
            frame_pos: 0,
        }
    }
}

impl<S> Iterator for TapSource<S>
where
    S: Source<Item = f32>,
{
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let sample = self.inner.next()?;

        // Downmix ke mono: rata-ratakan semua channel dalam satu frame
        self.frame_acc += sample;
        self.frame_pos += 1;
        if self.frame_pos >= self.channels {
            let mono = self.frame_acc / self.channels as f32;
            self.frame_acc = 0.0;
            self.frame_pos = 0;

            // try_lock supaya audio thread TIDAK PERNAH nunggu.
            // Kalau lagi dipakai analyzer thread, sample ini skip — gak masalah,
            // karena buffer terus keisi tiap frame berikutnya.
            if let Ok(mut buf) = self.buffer.try_lock() {
                if buf.len() >= RING_CAPACITY {
                    buf.pop_front();
                }
                buf.push_back(mono);
            }
        }

        Some(sample)
    }
}

impl<S> Source for TapSource<S>
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

    fn try_seek(&mut self, pos: Duration) -> Result<(), rodio::source::SeekError> {
        self.inner.try_seek(pos)
    }
}

/// Bangun edge frekuensi secara otomatis dengan log scale.
/// Menghasilkan array dengan panjang BAND_COUNT + 1.
fn build_band_edges() -> [f32; BAND_COUNT + 1] {
    let mut edges = [0.0f32; BAND_COUNT + 1];
    for i in 0..=BAND_COUNT {
        let t = i as f32 / BAND_COUNT as f32;
        edges[i] = MIN_FREQ * (MAX_FREQ / MIN_FREQ).powf(t);
    }
    edges
}

// ---- Cache: hal-hal di bawah ini SELALU sama tiap panggilan compute_band_levels,
// jadi dibangun sekali aja (lazy, saat pertama dibutuhkan) lalu di-reuse selamanya.
// Sebelumnya planner FFT + Hann window dibangun ULANG tiap panggilan (~30x/detik
// selama lagu main) — itu kerjaan CPU paling berat di file ini, padahal hasilnya
// selalu identik.

static FFT_PLAN: OnceLock<Arc<dyn Fft<f32>>> = OnceLock::new();
static HANN_WINDOW: OnceLock<[f32; FFT_SIZE]> = OnceLock::new();
static BAND_EDGES: OnceLock<[f32; BAND_COUNT + 1]> = OnceLock::new();

fn get_fft_plan() -> &'static Arc<dyn Fft<f32>> {
    FFT_PLAN.get_or_init(|| {
        let mut planner = FftPlanner::<f32>::new();
        planner.plan_fft_forward(FFT_SIZE)
    })
}

fn get_hann_window() -> &'static [f32; FFT_SIZE] {
    HANN_WINDOW.get_or_init(|| {
        let mut w = [0.0f32; FFT_SIZE];
        for (i, slot) in w.iter_mut().enumerate() {
            *slot = 0.5
                - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE as f32 - 1.0)).cos();
        }
        w
    })
}

fn get_band_edges() -> &'static [f32; BAND_COUNT + 1] {
    BAND_EDGES.get_or_init(build_band_edges)
}

pub fn compute_band_levels(buffer: &VisualizerBuffer, sample_rate: u32) -> [f32; BAND_COUNT] {
    // Array stack, bukan Vec — gak ada heap alloc tiap panggilan.
    let mut snapshot = [0.0f32; FFT_SIZE];
    {
        let buf = match buffer.try_lock() {
            Ok(b) => b,
            Err(_) => return [0.0; BAND_COUNT], // analyzer thread skip giliran ini, gak fatal
        };
        if buf.len() < FFT_SIZE {
            return [0.0; BAND_COUNT];
        }
        // Ambil FFT_SIZE sample terakhir, kembalikan ke urutan waktu asli (lama -> baru)
        for (i, v) in buf.iter().rev().take(FFT_SIZE).enumerate() {
            snapshot[FFT_SIZE - 1 - i] = *v;
        }
    }

    // Hann window - kurangi spectral leakage. Koefisien window-nya di-cache,
    // di sini tinggal kali-kali doang, gak ada cos() lagi.
    let window = get_hann_window();
    let mut spectrum = [Complex::new(0.0f32, 0.0f32); FFT_SIZE];
    for i in 0..FFT_SIZE {
        spectrum[i] = Complex::new(snapshot[i] * window[i], 0.0);
    }

    get_fft_plan().process(&mut spectrum);

    let bin_hz = sample_rate as f32 / FFT_SIZE as f32;
    let edges = get_band_edges();
    let mut levels = [0.0f32; BAND_COUNT];

    for band in 0..BAND_COUNT {
        let lo_bin = (edges[band] / bin_hz).max(1.0) as usize;
        let mut hi_bin = ((edges[band + 1] / bin_hz).round() as usize).min(FFT_SIZE / 2);

        // Kalau band ini lebih sempit dari 1 bin FFT, paksa minimal 1 bin
        // (boleh overlap sama band sebelah — wajar buat visualizer, gak masalah)
        if hi_bin <= lo_bin {
            hi_bin = (lo_bin + 1).min(FFT_SIZE / 2);
        }

        let sum: f32 = spectrum[lo_bin..hi_bin].iter().map(|c| c.norm()).sum();
        let avg = sum / (hi_bin - lo_bin) as f32;
        levels[band] = (avg / 40.0).min(1.0);
    }

    levels
}