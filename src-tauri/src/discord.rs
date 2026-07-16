// ============================================================================
// discord.rs
// ----------------------------------------------------------------------------
// Integrasi Discord Rich Presence lewat crate `discord-rich-presence`, yang
// meng-abstract IPC socket Discord untuk Windows (named pipe) & Unix/macOS
// (unix domain socket) di balik satu API yang sama.
//
// Semua logic + state fitur ini disatukan di file ini (pola sama seperti
// media_controls.rs/equalizer.rs/lyrics.rs) - titik sentuh ke file lain
// (lib.rs & commands.rs) dibuat seminimal mungkin, nempel di titik yang SUDAH
// ADA (persis titik yang sama dipakai media_controls.rs kemarin).
//
// CATATAN PENTING:
// - Cover art per-lagu TIDAK bisa ditampilkan dinamis di Discord (Discord RPC
//   butuh asset key yang di-upload duluan ke Developer Portal, atau URL
//   publik - bukan file lokal). Large image di sini pakai SATU key statis
//   (logo Michie) yang di-upload sekali di Developer Portal, supaya nol
//   overhead runtime (cuma kirim nama key, bukan data gambar).
// - Discord IPC cuma nyambung kalau Discord desktop client lagi jalan. Kalau
//   belum/nggak jalan, `connect()` gagal - ditangani diam-diam (di-log, tidak
//   crash), dan hanya dicoba ulang saat toggle di-nyalain lagi atau app
//   dibuka ulang. Tidak ada auto-retry loop background sengaja dibuat simpel
//   dulu - kalau nanti mau retry otomatis selagi nunggu Discord dibuka,
//   itu enhancement terpisah.
// - Isi DISCORD_CLIENT_ID di bawah dengan Application ID dari
//   https://discord.com/developers/applications (bikin aplikasi baru, upload
//   logo Michie di tab Rich Presence > Art Assets dengan key yang sama persis
//   seperti DISCORD_LARGE_IMAGE_KEY).
// ============================================================================

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use tauri_plugin_log::log;

use crate::types::SongTable;
use crate::AppState;

// TODO: ganti dengan Application ID asli dari Discord Developer Portal.
const DISCORD_CLIENT_ID: &str = "1527074294893641858";
// Harus sama persis dengan key yang di-upload di tab Rich Presence > Art Assets.
const DISCORD_LARGE_IMAGE_KEY: &str = "michie_logo";
const DISCORD_LARGE_IMAGE_TEXT: &str = "Michie";

pub struct DiscordPresence {
    client: Mutex<Option<DiscordIpcClient>>,
    // Disimpan supaya toggle play/pause (tanpa ganti lagu) bisa rebuild
    // activity tanpa perlu parameter lagu dikirim ulang dari caller.
    last_song: Mutex<Option<SongTable>>,
}

impl DiscordPresence {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            client: Mutex::new(None),
            last_song: Mutex::new(None),
        })
    }

    /// Coba connect ke Discord IPC di background thread (supaya command
    /// Tauri yang manggil ini tidak nge-block kalau Discord lagi lambat/
    /// belum kebuka). Aman dipanggil berkali-kali - kalau sudah konek,
    /// tidak melakukan apa-apa.
    ///
    /// Catatan: menerima `Arc<Self>` BY VALUE (bukan `&self`/`&Arc<Self>`) -
    /// itu satu-satunya bentuk receiver smart-pointer yang stabil tanpa
    /// `#![feature(arbitrary_self_types)]`. Panggil dengan
    /// `discord_rp.clone().enable()`, jangan `discord_rp.enable()` langsung
    /// kalau `discord_rp` masih dipakai lagi setelahnya.
    pub fn enable(self: Arc<Self>) {
        if self.client.lock().unwrap().is_some() {
            return; // sudah konek, tidak perlu apa-apa
        }
        std::thread::spawn(move || {
            // Di discord-rich-presence 1.x, `new()` tidak lagi mengembalikan
            // Result (beda dari versi lama) - infallible, error baru muncul
            // pas `.connect()`.
            let mut client = DiscordIpcClient::new(DISCORD_CLIENT_ID);
            match client.connect() {
                Ok(_) => {
                    log::info!("[DISCORD RP] connected to discord IPC");
                    *self.client.lock().unwrap() = Some(client);
                    // Kalau ada lagu yang lagi aktif, langsung tampilkan
                    // begitu berhasil connect (bukan nunggu event lagu-
                    // berganti berikutnya).
                    if let Some(song) = self.last_song.lock().unwrap().clone() {
                        self.push_activity(&song, true, 0);
                    }
                }
                Err(e) => {
                    log::warn!(
                        "[DISCORD RP] Failed to connect (Discord might not be opened): {:?}",
                        e
                    );
                }
            }
        });
    }

    /// Putus koneksi & bersihkan status di Discord. Dipanggil HANYA dari
    /// toggle Settings (matiin fitur) - lihat `clear_status()` untuk kasus
    /// "nggak ada lagu aktif tapi user masih mau fitur ini nyala".
    pub fn disable(&self) {
        let mut guard = self.client.lock().unwrap();
        if let Some(mut client) = guard.take() {
            let _ = client.clear_activity();
            let _ = client.close();
        }
        log::info!("[DISCORD RP] Disconnected (disabled from Settings)");
    }

    /// Bersihkan activity (mis. queue habis/kosong) TANPA memutus koneksi -
    /// beda dari `disable()`. Koneksi tetap hidup supaya lagu berikutnya
    /// langsung tampil lagi tanpa perlu toggle ulang di Settings.
    pub fn clear_status(&self) {
        *self.last_song.lock().unwrap() = None;
        let mut guard = self.client.lock().unwrap();
        if let Some(client) = guard.as_mut() {
            let _ = client.clear_activity();
        }
    }

    /// Dipanggil tiap kali lagu yang aktif berganti - titik yang sama persis
    /// dengan `NowPlaying::update_song`. `position_secs` dipakai buat hitung
    /// timestamp mulai, biar progress bar akurat walau dipanggil di tengah lagu.
    pub fn update_song(&self, song: &SongTable, position_secs: u64) {
        *self.last_song.lock().unwrap() = Some(song.clone());
        self.push_activity(song, true, position_secs);
    }

    /// Dipanggil tiap kali status play/pause berubah TANPA ganti lagu.
    pub fn set_playback(&self, is_playing: bool, position_secs: u64) {
        let Some(song) = self.last_song.lock().unwrap().clone() else {
            return;
        };
        self.push_activity(&song, is_playing, position_secs);
    }

    fn push_activity(&self, song: &SongTable, is_playing: bool, position_secs: u64) {
        let mut guard = self.client.lock().unwrap();
        let Some(client) = guard.as_mut() else {
            return; // belum di-enable / belum konek - diamkan
        };

        let assets = activity::Assets::new()
            .large_image(DISCORD_LARGE_IMAGE_KEY)
            .large_text(DISCORD_LARGE_IMAGE_TEXT);

        let state_text = if is_playing {
            format!("{} — {}", song.artist, song.album)
        } else {
            "paused".to_string()
        };

        let mut act = activity::Activity::new()
            .details(&song.name)
            .state(&state_text)
            .assets(assets);

        // Progress bar cuma masuk akal selagi beneran diputar - pas pause
        // sengaja tidak dikirim timestamps, biar Discord tidak nampilin bar
        // yang seolah masih jalan.
        if is_playing {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            let start = now - position_secs as i64;
            let end = start + song.duration as i64;
            act = act.timestamps(activity::Timestamps::new().start(start).end(end));
        }

        if client.set_activity(act).is_err() {
            // Koneksi kemungkinan putus (mis. Discord ditutup manual) -
            // lepas client-nya biar tidak terus-menerus nyoba kirim ke
            // socket yang sudah mati. Nyala lagi lewat toggle Settings.
            log::warn!("[DISCORD RP] Failed to send activity, connection considered dead");
            *guard = None;
        }
    }
}

// ---------------------------------------- Commands ----------------------------------------

/// Baca status toggle Discord RP dari DB. Tidak butuh koneksi live -
/// murni baca kolom `discord_rp_enabled` di tabel `settings`.
#[tauri::command(rename_all = "snake_case")]
pub async fn get_discord_rp_enabled(state: State<AppState, '_>) -> Result<bool, String> {
    let res: Result<(bool,), sqlx::Error> =
        sqlx::query_as("SELECT discord_rp_enabled FROM settings WHERE id = 1")
            .fetch_one(&state.pool)
            .await;

    Ok(res.map(|r| r.0).unwrap_or(false))
}

/// Persist toggle ke DB (pola ON CONFLICT, BUKAN INSERT OR REPLACE - lihat
/// catatan di db.rs kenapa ini penting) sekaligus langsung connect/disconnect
/// Discord IPC tanpa perlu restart app.
#[tauri::command(rename_all = "snake_case")]
pub async fn set_discord_rp_enabled(
    state: State<AppState, '_>,
    enabled: bool,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO settings (id, discord_rp_enabled) VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET discord_rp_enabled = excluded.discord_rp_enabled",
    )
    .bind(enabled)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    if enabled {
        state.discord_rp.clone().enable();
    } else {
        state.discord_rp.disable();
    }

    Ok(())
}