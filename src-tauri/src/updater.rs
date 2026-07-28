// updater.rs
//
// Cek-versi, download, dan install update sepenuhnya ditangani oleh
// `tauri-plugin-updater` resmi, dipanggil langsung dari frontend lewat
// `services/updateService.ts` (JS API plugin ini sudah lengkap, gak perlu
// command Tauri custom buat itu). Modul ini cuma nyediain SATU command
// tambahan yang app-specific: beresin state pemutaran SEBELUM app
// di-relaunch buat pasang update.
//
// Kenapa perlu: kalau user pencet "update" pas lagu lagi diputar, terus app
// langsung di-kill buat relaunch tanpa cleanup, OS-level media controls
// (SMTC/MPRIS/Now Playing) dan Discord Rich Presence bisa nyangkut nunjukin
// "Michie masih main" walau prosesnya udah mati. Command ini niru pola stop
// yang sama kayak di watcher thread (lib.rs) sebelum proses relaunch beneran
// jalan.

use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn pre_update_cleanup(state: State<AppState>) -> Result<(), String> {
    {
        let mut player = state.player.lock().map_err(|e| e.to_string())?;
        player.stop_song();
    }
    state.now_playing.set_playback(false);
    state.discord_rp.clear_status();
    Ok(())
}