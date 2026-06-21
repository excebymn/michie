use image::{ImageReader, imageops::FilterType};
use std::io::Cursor;
use std::path::PathBuf;
use anyhow::Result;
use tauri::Manager;

const THUMB_SIZE: u32 = 400;

pub fn cache_artwork(
    track_id: &str,
    bytes: &[u8],
    app: &tauri::AppHandle,
) -> Result<String> {
    let art_dir = app
        .path()
        .app_data_dir()?
        .join("artwork");
    
    std::fs::create_dir_all(&art_dir)?;
    
    let out_path = art_dir.join(format!("{track_id}.jpg"));
    
    let img = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()?
        .decode()?;

    img.resize(THUMB_SIZE, THUMB_SIZE, FilterType::Lanczos3)
        .save_with_format(&out_path, image::ImageFormat::Jpeg)?;

    Ok(out_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_artwork(
    track_id: String,
    app: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let art_path: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("artwork")
        .join(format!("{track_id}.jpg"));

    if art_path.exists() {
        Ok(serde_json::json!({
            "path": art_path.to_string_lossy(),
            "base64": null
        }))
    } else {
        Ok(serde_json::json!({ "path": null, "base64": null }))
    }
}