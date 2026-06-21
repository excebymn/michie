use std::sync::Mutex;
use serde::{Deserialize, Serialize};

pub struct AppState {
    pub db_path: Mutex<String>,
    pub watch_paths: Mutex<Vec<String>>,
}

impl AppState {
    pub fn new(db_path: String) -> Self {
        Self {
            db_path: Mutex::new(db_path),
            watch_paths: Mutex::new(Vec::new()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_artist: Option<String>,
    pub duration: f64,
    pub file_path: String,
    pub artwork_path: Option<String>,
    pub track_number: Option<u32>,
    pub year: Option<u32>,
    pub genre: Option<String>,
    pub bitrate: Option<u32>,
    pub sample_rate: Option<u32>,
    pub date_added: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub added: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}