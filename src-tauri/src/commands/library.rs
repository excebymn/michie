use tauri::State;
use tauri::Emitter;  // ← TAMBAHKAN INI
use crate::state::{AppState, ScanResult, Track};
use super::metadata::{extract_metadata, extract_artwork_bytes};
use super::artwork::cache_artwork;

const AUDIO_EXT: &[&str] = &["mp3","flac","aac","m4a","ogg","wav","opus","ape"];

#[tauri::command]
pub async fn scan_folder(
    folder_path: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<ScanResult, String> {
    let mut result = ScanResult { added: 0, skipped: 0, errors: vec![] };

    let files: Vec<_> = walkdir::WalkDir::new(&folder_path)
        .into_iter().filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() &&
            e.path().extension().and_then(|s| s.to_str())
             .map(|ext| AUDIO_EXT.contains(&ext.to_lowercase().as_str()))
             .unwrap_or(false))
        .collect();

    let total = files.len();

    for (i, entry) in files.iter().enumerate() {
        if i % 10 == 0 {
            let _ = app.emit("scan_progress", serde_json::json!({"current": i, "total": total}));
        }
        let path = entry.path().to_string_lossy().to_string();
        match process_file(&path, &state, &app).await {
            Ok(true)  => result.added   += 1,
            Ok(false) => result.skipped += 1,
            Err(e)    => result.errors.push(format!("{path}: {e}")),
        }
    }
    let _ = app.emit("scan_complete", &result);
    Ok(result)
}

async fn process_file(
    path: &str,
    _state: &State<'_, AppState>,  // ← Tambah underscore
    app: &tauri::AppHandle,
) -> Result<bool, String> {
    let mut track = extract_metadata(path).map_err(|e| e.to_string())?;
    if let Ok(Some(bytes)) = extract_artwork_bytes(path) {
        if let Ok(art_path) = cache_artwork(&track.id, &bytes, app) {
            track.artwork_path = Some(art_path);
        }
    }
    Ok(true)
}

#[tauri::command]
pub async fn get_tracks(
    _state: State<'_, AppState>,      // ← Tambah underscore
    _sort_by: Option<String>,         // ← Tambah underscore
    _order: Option<String>,           // ← Tambah underscore
    _search: Option<String>,          // ← Tambah underscore
) -> Result<Vec<Track>, String> {
    Ok(vec![])
}

#[tauri::command]
pub async fn delete_track(
    _track_id: String,                // ← Tambah underscore
    _state: State<'_, AppState>
) -> Result<(), String> {
    Ok(())
}