mod state;
mod commands {
    pub mod library;
    pub mod metadata;
    pub mod artwork;
}
mod db {
    pub mod schema;
}

use state::AppState;
use tauri::Manager;  // ← TAMBAHKAN INI

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let db_path = app.path()
                .app_data_dir()?
                .join("melodyne.db")
                .to_string_lossy()
                .to_string();
            app.manage(AppState::new(db_path));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_folder,
            commands::library::get_tracks,
            commands::library::delete_track,
            commands::artwork::get_artwork,
        ])
        .run(tauri::generate_context!())
        .expect("error running melodyne")
}