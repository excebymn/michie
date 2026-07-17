// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() -> Result<(), String> {
    // Workaround untuk crash "Could not create default EGL display" yang sering
    // terjadi di WebKitGTK saat aplikasi dijalankan di Linux (terutama lewat
    // AppImage), khususnya pada sesi Wayland dan/atau driver GPU tertentu
    // (Intel/AMD/Nvidia). Hanya di-set kalau user belum override manual sendiri.
    #[cfg(target_os = "linux")]
    {
        // SAFETY: dipanggil sebelum thread lain dibuat (awal fn main),
        // jadi tidak ada risiko data race saat set env var ini.
        unsafe {
            if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
                std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
            }
            if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            }
        }
    }

    michie_player_lib::run()
}