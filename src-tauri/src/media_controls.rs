// ============================================================================
// media_controls.rs
// ----------------------------------------------------------------------------
// Integrasi Michie ke kontrol media level-OS, SATU implementasi untuk ketiga
// platform lewat crate `souvlaki`:
//   - Linux   -> MPRIS2 (D-Bus)      -> kedeteksi widget desktop/GNOME/KDE/dst
//   - Windows -> SMTC                -> muncul di notification center Windows
//   - macOS   -> Now Playing/Control Center
//
// Semua logic + state fitur ini sengaja disatukan di file ini (pola yang sama
// seperti equalizer.rs/visualizer.rs/lyrics.rs) supaya tidak membebani file
// lain. Titik sentuh ke file lain (lib.rs & commands.rs) dibuat seminimal
// mungkin - cuma manggil method di sini pada titik-titik yang SUDAH ADA.
//
// Modul ini MENGGANTIKAN blok `#[cfg(windows)]` tauri_plugin_global_shortcut
// media-key handler lama: event Play/Pause/Next/Previous sekarang datang dari
// sini untuk KETIGA OS, bukan cuma Windows.
//
// CATATAN VERSI-SENSITIF (baca sebelum compile):
// API `PlatformConfig` dan `MediaMetadata` milik `souvlaki` bisa berbeda field
// persis antar versi crate. Kode di bawah ditulis mengikuti API yang paling
// umum dipakai saat ini, tapi SATU titik yang paling mungkin perlu disesuaikan
// manual adalah bagian pengambilan window handle di `NowPlaying::init` untuk
// Windows (tipe `hwnd` pada `PlatformConfig`) - kalau compiler komplain di situ,
// cek `cargo doc --open -p souvlaki` untuk field/tipe yang persis sesuai versi
// yang ter-install.
// ============================================================================

use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use souvlaki::{
    MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, MediaPosition,
    PlatformConfig,
};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::types::{GetCurrentSong, SongTable};
use crate::AppState;

/// Wrapper supaya `MediaControls` (dari souvlaki, tidak `Clone`) bisa disimpan
/// sebagai field di `AppState` dan diakses dari banyak tempat (watcher thread,
/// command handler) lewat `Arc<NowPlaying>`.
pub struct NowPlaying {
    controls: Mutex<MediaControls>,
}

impl NowPlaying {
    /// Harus dipanggil SEKALI dari main thread di dalam `.setup()`, setelah
    /// window utama ada (dibutuhkan buat ambil window handle di Windows).
    pub fn init(app: &tauri::App) -> Result<Self, String> {
        let window = app
            .get_webview_window("main")
            .ok_or_else(|| "Window utama belum tersedia saat NowPlaying::init".to_string())?;

        #[cfg(target_os = "windows")]
        let hwnd: Option<*mut std::ffi::c_void> = {
            match window.window_handle().map(|h| h.as_raw()) {
                Ok(RawWindowHandle::Win32(handle)) => {
                    Some(handle.hwnd.get() as *mut std::ffi::c_void)
                }
                _ => {
                    log::warn!("[MEDIA CONTROLS] Gagal ambil HWND, SMTC mungkin tidak aktif");
                    None
                }
            }
        };
        #[cfg(not(target_os = "windows"))]
        let hwnd: Option<*mut std::ffi::c_void> = None;

        let config = PlatformConfig {
            dbus_name: "michie_player",
            display_name: "Michie",
            hwnd,
        };

        let mut controls = MediaControls::new(config)
            .map_err(|e| format!("Gagal membuat MediaControls: {:?}", e))?;

        let app_handle = app.handle().clone();
        controls
            .attach(move |event: MediaControlEvent| {
                handle_media_event(&app_handle, event);
            })
            .map_err(|e| format!("Gagal attach media control handler: {:?}", e))?;

        log::info!("[MEDIA CONTROLS] Terpasang untuk platform saat ini");

        Ok(Self {
            controls: Mutex::new(controls),
        })
    }

    /// Dipanggil tiap kali lagu yang sedang aktif berganti - titik yang sama
    /// persis dengan tempat event Tauri "get-current-song" sudah di-emit
    /// (baik dari command manual maupun watcher auto-advance).
    pub fn update_song(&self, song: &SongTable) {
        let Ok(mut controls) = self.controls.lock() else {
            return;
        };

        // PENTING: ini BUKAN path asset://localhost/... yang dipakai frontend
        // WebView. Notification Center/SMTC baca artwork langsung dari path
        // file OS, jadi harus file:// URI ke path asli di disk.
        let art_url = format!("file://{}", song.cover);

        let _ = controls.set_metadata(MediaMetadata {
            title: Some(&song.name),
            artist: Some(&song.artist),
            album: Some(&song.album),
            cover_url: Some(&art_url),
            duration: Some(Duration::from_secs(song.duration)),
            ..Default::default()
        });
    }

    /// Dipanggil tiap kali status play/pause berubah, baik lewat command
    /// frontend biasa maupun lewat event media key dari OS sendiri.
    pub fn set_playback(&self, is_playing: bool) {
        let Ok(mut controls) = self.controls.lock() else {
            return;
        };
        let playback = if is_playing {
            MediaPlayback::Playing { progress: None }
        } else {
            MediaPlayback::Paused { progress: None }
        };
        let _ = controls.set_playback(playback);
    }
}

/// Map event dari OS (tombol media fisik, kontrol di notification center/
/// Control Center) balik ke fungsi yang SAMA PERSIS dipakai command Tauri
/// biasa di commands.rs/music.rs - bukan logic baru, cuma jalur masuk baru
/// ke `MusicPlayer` yang sudah ada.
fn handle_media_event(app: &AppHandle, event: MediaControlEvent) {
    let state = app.state::<AppState>();

    match event {
        MediaControlEvent::Play => {
            state.player.lock().unwrap().play_song();
            state.now_playing.set_playback(true);
            let _ = app.emit("controls-play-pause", true);
        }
        MediaControlEvent::Pause => {
            state.player.lock().unwrap().pause_song();
            state.now_playing.set_playback(false);
            let _ = app.emit("controls-play-pause", false);
        }
        MediaControlEvent::Toggle => {
            let mut player = state.player.lock().unwrap();
            let now_playing_flag = player.check_is_paused();
            if now_playing_flag {
                player.play_song();
            } else {
                player.pause_song();
            }
            drop(player);
            state.now_playing.set_playback(now_playing_flag);
            let _ = app.emit("controls-play-pause", now_playing_flag);
        }
        MediaControlEvent::Next => {
            let mut player = state.player.lock().unwrap();
            if player.check_is_loaded() {
                player.next_song();
                if let Ok(song) = player.get_current_song() {
                    drop(player);
                    state.now_playing.update_song(&song);
                    state.now_playing.set_playback(true);
                    let _ = app.emit("get-current-song", GetCurrentSong { q: song });
                }
            }
        }
        MediaControlEvent::Previous => {
            let mut player = state.player.lock().unwrap();
            if player.check_is_loaded() {
                player.previous_song();
                if let Ok(song) = player.get_current_song() {
                    drop(player);
                    state.now_playing.update_song(&song);
                    state.now_playing.set_playback(true);
                    let _ = app.emit("get-current-song", GetCurrentSong { q: song });
                }
            }
        }
        MediaControlEvent::SetPosition(MediaPosition(pos)) => {
            state.player.lock().unwrap().seek(pos.as_secs());
        }
        // Seek/OpenUri/Raise/Quit/dll: belum ada mapping - sengaja diabaikan
        // dulu daripada asal nebak perilaku yang salah.
        _ => {}
    }
}