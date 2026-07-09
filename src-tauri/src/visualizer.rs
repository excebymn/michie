use rodio::Source;
use rustfft::{num_complex::Complex, FftPlanner};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::Duration;

// Ukuran window FFT (harus pangkat 2). 1024 sample @ 44.1kHz ~= 23ms per window —
// cukup responsif buat ngikutin beat tanpa kelihatan "gerigi".
const FFT_SIZE: usize = 1024;
const RING_CAPACITY: usize = FFT_SIZE * 2;

// Jumlah bar visualizer — tinggal ubah angka ini kalau mau ganti jumlah bar
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

    // BARU — tanpa ini, try_seek jatuh ke default impl yang selalu Err
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

pub fn compute_band_levels(buffer: &VisualizerBuffer, sample_rate: u32) -> [f32; BAND_COUNT] {
    let snapshot: Vec<f32> = {
        let buf = match buffer.try_lock() {
            Ok(b) => b,
            Err(_) => return [0.0; BAND_COUNT], // analyzer thread skip giliran ini, gak fatal
        };
        if buf.len() < FFT_SIZE {
            return [0.0; BAND_COUNT];
        }
        buf.iter().rev().take(FFT_SIZE).rev().copied().collect()
    };

    // Hann window - kurangi spectral leakage
    let mut spectrum: Vec<Complex<f32>> = snapshot
        .iter()
        .enumerate()
        .map(|(i, &s)| {
            let w =
                0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE as f32 - 1.0)).cos();
            Complex::new(s * w, 0.0)
        })
        .collect();

    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(FFT_SIZE);
    fft.process(&mut spectrum);

    let bin_hz = sample_rate as f32 / FFT_SIZE as f32;
    let edges = build_band_edges();
    let mut levels = [0.0f32; BAND_COUNT];

    for band in 0..BAND_COUNT {
    let lo_bin = (edges[band] / bin_hz).max(1.0) as usize;
    let mut hi_bin = ((edges[band + 1] / bin_hz).round() as usize).min(FFT_SIZE / 2);

    // BARU: kalau band ini lebih sempit dari 1 bin FFT, paksa minimal 1 bin
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
