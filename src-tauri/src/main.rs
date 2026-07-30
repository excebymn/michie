// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Deteksi apakah driver NVIDIA proprietary (bukan nouveau) sedang dipakai,
/// dengan mengecek apakah kernel module `nvidia` ter-load.
#[cfg(target_os = "linux")]
fn is_nvidia_proprietary_driver() -> bool {
    std::path::Path::new("/sys/module/nvidia").exists()
}

fn main() -> Result<(), String> {
    // Workaround untuk crash "Could not create default EGL display" yang sering
    // terjadi di WebKitGTK saat aplikasi dijalankan di Linux (terutama lewat
    // AppImage) pada sesi Wayland. Hanya di-set kalau user belum override
    // manual sendiri.
    #[cfg(target_os = "linux")]
    {
        // SAFETY: dipanggil sebelum thread lain dibuat (awal fn main),
        // jadi tidak ada risiko data race saat set env var ini.
        unsafe {
            // Fix ringan: cuma ganti mekanisme buffer-sharing DMA-BUF, GPU
            // compositing WebKit tetap aktif. Aman untuk hampir semua driver
            // (Intel/AMD/nouveau) tanpa mengorbankan performa animasi/transisi.
            if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            }

            // Fix berat: mematikan GPU-accelerated compositing sepenuhnya
            // (fallback ke software rendering) -- bikin animasi/transisi UI
            // patah-patah di GPU Intel/AMD. Hanya di-apply kalau driver
            // proprietary NVIDIA terdeteksi, karena vendor ini yang paling
            // sering butuh fix seberat ini untuk menghindari crash EGL.
            if is_nvidia_proprietary_driver()
                && std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err()
            {
                std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
            }
        }
    }

    michie_player_lib::run()
}