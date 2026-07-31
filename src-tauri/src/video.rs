// ============================================================================
// video.rs
// ----------------------------------------------------------------------------
// Backend "Video Player Mode" — DELIBERATELY kept fully separate from
// music.rs/commands.rs/db.rs (same pattern as equalizer.rs/visualizer.rs/
// lyrics.rs: one file bundles types + state + commands for one feature,
// minimizing touch points with other files).
//
// Playback happens on the frontend via a native <video> element (WebView2/
// WebKitGTK/WKWebView), BUT unlike the v1 design: before playback, the file
// is probed (ffprobe) and, if needed, transcoded/remuxed (ffmpeg) to MP4
// H.264/AAC via a cross-platform sidecar. This is so MKV/AVI/WMV/HEVC/etc.
// files — which aren't always supported by the OS's built-in WebView
// (especially Linux WebKitGTK, whose codec support depends on system
// GStreamer packages) — still play consistently across all platforms.
//
// This module's responsibilities:
//   - video scan directories (`video_dirs`, separate from music's `dirs`)
//   - scan result table (`videos`)
//   - light CRUD: remove video from library, attach subtitle file
//   - probe + transcode-on-demand + transcode cache (`prepare_video_playback`)
//
// IMPORTANT re: media controls (see media_controls.rs, souvlaki - MPRIS/SMTC/
// Now Playing): this module DELIBERATELY never touches `AppState.now_playing`
// or `AppState.player`. Video Player Mode is purely UI-side (music is already
// paused from the frontend before entering this mode).
// ============================================================================

use crate::types::DirsTable;
use crate::AppState;
use std::collections::hash_map::DefaultHasher;
use std::ffi::OsStr;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;
use tauri::{Emitter, Manager, State};
use tauri_plugin_log::log;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

const VIDEO_EXTENSIONS: [&str; 7] = ["mp4", "mkv", "webm", "mov", "avi", "m4v", "wmv"];

#[derive(sqlx::FromRow, Default, Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VideoTable {
    pub path: String,
    pub name: String,
    pub duration: i64,
    // Nullable — most videos have no subtitle until the user manually attaches
    // one via set_video_subtitle. #[sqlx(default)] matters so old rows
    // (before this column existed) don't panic FromRow.
    #[sqlx(default)]
    pub subtitle_path: Option<String>,
}

#[derive(Clone, serde::Serialize)]
pub struct VideoScanProgress {
    length: usize,
    current: usize,
}

// NEW — progress event emitted while FFmpeg transcoding is running.
#[derive(Clone, serde::Serialize)]
pub struct TranscodeProgress {
    pub path: String,
    /// 0.0-100.0. -1.0 if the source duration couldn't be probed (ffprobe
    /// failed to read duration metadata), so the frontend can show an
    /// "in progress" indicator without a percentage instead of being stuck
    /// at 0%.
    pub percent: f32,
}

// ---------------------------------------- Setup ----------------------------------------

/// Called once from `run()` in lib.rs (alongside `db::init()`) — prepares
/// the subtitle & transcode-cache folders before they're needed, same
/// pattern as the covers/playlist_covers folders in db::init().
pub fn init() {
    let base = dirs::home_dir().unwrap().to_str().unwrap().to_string() + "/.config/michie_player";
    let _ = fs::create_dir_all(Path::new(&(base.clone() + "/subtitles")));
    // NEW: transcode/remux result cache. Deliberately placed under
    // $HOME/.config, which is already covered by the static assetProtocol
    // scope in tauri.conf.json ("$HOME/.config/**") — so no runtime
    // allow_directory call is needed for this folder, unlike user-picked
    // video folders which can live anywhere on disk (see
    // allow_directory_for_asset_protocol below).
    let _ = fs::create_dir_all(Path::new(&(base + "/video_cache")));
}

fn video_cache_dir() -> String {
    dirs::home_dir().unwrap().to_str().unwrap().to_string() + "/.config/michie_player/video_cache"
}

// ---------------------------------------- Directories ----------------------------------------

#[tauri::command(rename_all = "snake_case")]
pub async fn add_video_directory(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
    directory_name: String,
) -> Result<(), String> {
    sqlx::query("INSERT OR IGNORE INTO video_dirs (dir_path) VALUES (?1);")
        .bind(&directory_name)
        .execute(&state.pool)
        .await
        .map_err(|e| format!("Error saving video directory path: {}", e))?;

    allow_directory_for_asset_protocol(&app, &directory_name);

    Ok(())
}

// VERSION-SENSITIVE NOTE (same spirit as the note in media_controls.rs about
// souvlaki's PlatformConfig): unlike songs (read directly from disk by rodio
// in Rust, NEVER through the asset protocol), video is played through a
// native <video> element in the WebView -> its src MUST go through Tauri's
// asset protocol (convertFileSrc on the frontend). The user's chosen video
// folder can be ANYWHERE on disk (not just under $HOME/.config like cover/
// background images), so the static asset-protocol scope in tauri.conf.json
// does NOT automatically cover it. This function adds the folder to the
// scope AT RUNTIME as soon as the user picks it, so there's no need for a
// manual per-user whitelist in tauri.conf.json. The exact method name
// (`asset_protocol_scope().allow_directory(...)`) may differ slightly
// depending on the installed `tauri` crate version (2.10 per this project's
// notes) — if the compiler complains here, check `cargo doc --open -p tauri`
// for the matching scope API.
fn allow_directory_for_asset_protocol(app: &tauri::AppHandle, dir_path: &str) {
    if let Err(e) = app.asset_protocol_scope().allow_directory(dir_path, true) {
        log::error!(
            "[VIDEO] Failed to add folder to asset protocol scope: {:?}",
            e
        );
    }
}

#[tauri::command]
pub async fn get_video_directory(state: State<'_, AppState>) -> Result<Vec<DirsTable>, String> {
    // Reuse the `DirsTable` struct (just `dir_path`) — identical shape to a
    // `dirs` row, so no separate directory type is needed just for this.
    let temp: Vec<DirsTable> = sqlx::query_as::<_, DirsTable>("SELECT dir_path FROM video_dirs")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| format!("Error fetching video directories: {}", e))?;

    Ok(temp)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_video_directory(
    state: State<'_, AppState>,
    directory_name: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM video_dirs WHERE dir_path = ?")
        .bind(&directory_name)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ---------------------------------------- Library ----------------------------------------

#[tauri::command]
pub async fn get_all_videos(state: State<'_, AppState>) -> Result<Vec<VideoTable>, String> {
    let list: Vec<VideoTable> = sqlx::query_as::<_, VideoTable>(
        "SELECT path, name, duration, subtitle_path FROM videos ORDER BY name ASC",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(list)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_video(state: State<'_, AppState>, path: String) -> Result<(), String> {
    sqlx::query("DELETE FROM videos WHERE path = ?")
        .bind(&path)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Project-wide convention (see the notes on db::set_background_image /
// db::add_playlist_cover): a user-picked local file path must be copied into
// a folder owned by the app before its path is stored permanently — the
// original file-picker path isn't guaranteed to be readable again through
// Tauri's asset protocol after the app restarts.
#[tauri::command(rename_all = "snake_case")]
pub async fn set_video_subtitle(
    state: State<'_, AppState>,
    video_path: String,
    subtitle_file_path: String,
) -> Result<String, String> {
    let subs_dir = dirs::home_dir().unwrap().to_str().unwrap().to_string()
        + "/.config/michie_player/subtitles";
    fs::create_dir_all(&subs_dir).map_err(|e| e.to_string())?;

    let ext = Path::new(&subtitle_file_path)
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or("srt");

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let new_path = format!("{subs_dir}/subtitle_{timestamp}.{ext}");

    fs::copy(&subtitle_file_path, &new_path).map_err(|e| e.to_string())?;

    sqlx::query("UPDATE videos SET subtitle_path = ?1 WHERE path = ?2")
        .bind(&new_path)
        .bind(&video_path)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(new_path)
}

// Detach an already-attached subtitle (the "remove subtitle" button in the
// video popup menu). The physical file is deliberately not deleted from
// disk — just its reference is cleared, the same caution used by
// delete_playlist regarding cover files (avoid panicking if the path turns
// out to no longer exist).
#[tauri::command(rename_all = "snake_case")]
pub async fn clear_video_subtitle(
    state: State<'_, AppState>,
    video_path: String,
) -> Result<(), String> {
    sqlx::query("UPDATE videos SET subtitle_path = NULL WHERE path = ?1")
        .bind(&video_path)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ---------------------------------------- Scan ----------------------------------------

fn is_video_file(path: &Path) -> bool {
    path.extension()
        .and_then(OsStr::to_str)
        .map(|ext| VIDEO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

// Performance note: the music scan (scan_directory in lib.rs) uses a thread
// pool + channel because each file needs heavy metadata parsing (lofty).
// Video in this v1 DELIBERATELY skips metadata extraction entirely (name =
// file name, duration is filled in later by the frontend via the <video>
// element the first time it's opened) — so a plain folder walk is more than
// enough, no need for the same thread-pool complexity.
#[tauri::command]
pub async fn scan_video_directory(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let directories: Vec<DirsTable> = sqlx::query_as::<_, DirsTable>("SELECT dir_path FROM video_dirs")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    app.emit("video-scan-started", true).unwrap();
    log::info!("Video scan has started");

    // Mark all videos as "not seen again yet" for this scan — same pattern
    // as db::set_keep for songs. At the end, any entry whose keep flag is
    // still 0 means its file no longer exists / its source folder was
    // removed.
    let _ = sqlx::query("UPDATE videos SET keep = 0")
        .execute(&state.pool)
        .await;

    let mut entries: Vec<String> = vec![];
    for dir in &directories {
        for entry in jwalk::WalkDir::new(&dir.dir_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file() && is_video_file(&e.path()))
        {
            entries.push(entry.path().display().to_string());
        }
    }

    let scan_length = entries.len();
    app.emit(
        "video-scan-length",
        VideoScanProgress {
            length: scan_length,
            current: 0,
        },
    )
    .unwrap();

    for (i, path) in entries.iter().enumerate() {
        let name = Path::new(path)
            .file_stem()
            .and_then(OsStr::to_str)
            .unwrap_or("Untitled")
            .to_string();

        let exists: (bool,) =
            sqlx::query_as("SELECT EXISTS(SELECT 1 FROM videos WHERE path = ?)")
                .bind(path)
                .fetch_one(&state.pool)
                .await
                .unwrap_or((false,));

        if exists.0 {
            let _ = sqlx::query("UPDATE videos SET keep = 1, name = ?1 WHERE path = ?2")
                .bind(&name)
                .bind(path)
                .execute(&state.pool)
                .await;
        } else {
            let _ = sqlx::query(
                "INSERT INTO videos (path, name, duration, keep) VALUES (?1, ?2, 0, 1)",
            )
            .bind(path)
            .bind(&name)
            .execute(&state.pool)
            .await;
        }

        if (i + 1) % 25 == 0 {
            app.emit(
                "video-scan-length",
                VideoScanProgress {
                    length: scan_length,
                    current: i + 1,
                },
            )
            .unwrap();
        }
    }

    // Drop videos whose file wasn't found in this scan.
    let _ = sqlx::query("DELETE FROM videos WHERE keep = 0")
        .execute(&state.pool)
        .await;

    app.emit(
        "video-scan-length",
        VideoScanProgress {
            length: scan_length,
            current: scan_length,
        },
    )
    .unwrap();
    app.emit("video-scan-finished", true).unwrap();
    log::info!("Video scan finished — {} video(s) found", scan_length);

    Ok(())
}

// Same purpose as scan_for_deleted (lib.rs) for songs — called separately
// from a full rescan, for a quick check of files that were moved/deleted
// outside the app without needing to rescan the whole folder from scratch.
#[tauri::command]
pub async fn scan_video_for_deleted(state: State<'_, AppState>, app: tauri::AppHandle) -> Result<(), String> {
    let videos: Vec<(String,)> = sqlx::query_as("SELECT path FROM videos")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    for (path,) in videos {
        if !Path::new(&path).exists() {
            let _ = sqlx::query("DELETE FROM videos WHERE path = ?")
                .bind(&path)
                .execute(&state.pool)
                .await;
        }
    }

    app.emit("video-removed", false).unwrap();
    Ok(())
}

// ---------------------------------------- Transcode (NEW) ----------------------------------------

/// Run ffprobe to read the codec of a single stream (`v:0` for video, `a:0`
/// for audio). Returns `None` if the stream doesn't exist (video with no
/// audio track, treated as SAFE) OR if ffprobe itself fails to run/parse
/// (this case is conservatively treated by the caller as "needs
/// transcoding" — so the worst case is "transcoded when it didn't strictly
/// need to be", not "fails to play at all").
async fn ffprobe_codec(app: &tauri::AppHandle, path: &str, stream_selector: &str) -> Option<String> {
    let sidecar = app.shell().sidecar("ffprobe").ok()?;
    let output = sidecar
        .args([
            "-v",
            "error",
            "-select_streams",
            stream_selector,
            "-show_entries",
            "stream=codec_name",
            "-of",
            "csv=p=0",
            path,
        ])
        .output()
        .await
        .ok()?;

    let codec = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
    if codec.is_empty() {
        None
    } else {
        Some(codec)
    }
}

async fn ffprobe_duration_secs(app: &tauri::AppHandle, path: &str) -> Option<f64> {
    let sidecar = app.shell().sidecar("ffprobe").ok()?;
    let output = sidecar
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            path,
        ])
        .output()
        .await
        .ok()?;

    String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse::<f64>()
        .ok()
}

/// Cache key = hash(full path + source file's modification time). If the
/// source file changes (re-edited, replaced), mtime changes -> key changes
/// -> automatically transcoded again, never mistakenly using a stale cache.
///
/// Deliberately uses `DefaultHasher` (std, not a crypto hash) — this is only
/// for naming a cache file within a SINGLE app install, not for security.
/// Even if the hash differs across Rust std versions (theoretically
/// possible), the worst effect is "cache miss, re-transcode" — not
/// corrupted/incorrect data.
fn cache_key_for(path: &str, mtime_secs: u64) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    mtime_secs.hash(&mut hasher);
    format!("{:x}.mp4", hasher.finish())
}

/// Main command called by the frontend BEFORE rendering the <video> element
/// in VideoPlayerMode. Returns a path ready to be passed straight into
/// `convertFileSrc()` — either the original path (fast path, no delay) or
/// the transcoded result in the cache (once the process finishes).
#[tauri::command(rename_all = "snake_case")]
pub async fn prepare_video_playback(
    app: tauri::AppHandle,
    video_path: String,
) -> Result<String, String> {
    let meta = fs::metadata(&video_path)
        .map_err(|e| format!("Video file not found or unreadable: {}", e))?;
    let mtime_secs = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let cache_dir = video_cache_dir();
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    let cache_file = format!("{}/{}", cache_dir, cache_key_for(&video_path, mtime_secs));

    // Already transcoded once & the source file hasn't changed -> use the
    // cache, skip ffprobe & ffmpeg entirely (reopening the same video
    // becomes instant after the first time).
    if Path::new(&cache_file).exists() {
        return Ok(cache_file);
    }

    let ext = Path::new(&video_path)
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or("")
        .to_lowercase();

    let video_codec = ffprobe_codec(&app, &video_path, "v:0").await;
    let audio_codec = ffprobe_codec(&app, &video_path, "a:0").await;

    let video_ok = video_codec.as_deref() == Some("h264");
    // None = no audio track at all -> safe, no audio transcode needed.
    let audio_ok = matches!(audio_codec.as_deref(), Some("aac") | None);
    let container_ok = matches!(ext.as_str(), "mp4" | "m4v" | "mov");

    if container_ok && video_ok && audio_ok {
        // Fast path: already compatible across all three platforms, no need
        // to spend time/quality on transcoding.
        return Ok(video_path);
    }

    app.emit("video-transcode-started", video_path.clone()).ok();
    log::info!(
        "[VIDEO] Starting transcode for {} (video_codec={:?}, audio_codec={:?}, ext={})",
        video_path,
        video_codec,
        audio_codec,
        ext
    );

    let duration = ffprobe_duration_secs(&app, &video_path).await;

    // Stream-copy each track individually when that track is already
    // compatible on its own (common case: H.264 video inside an MKV
    // container -> just remux, no need to re-encode the video itself,
    // which is the heaviest and slowest part).
    let video_arg = if video_ok { "copy" } else { "libx264" };
    let audio_arg = if audio_ok { "copy" } else { "aac" };

    let sidecar = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| format!("ffmpeg sidecar not found: {}", e))?;

    let mut args: Vec<String> = vec![
        "-y".into(),
        "-i".into(),
        video_path.clone(),
        "-c:v".into(),
        video_arg.into(),
    ];
    if video_arg == "libx264" {
        args.extend(["-preset".into(), "veryfast".into(), "-crf".into(), "20".into()]);
    }
    args.extend(["-c:a".into(), audio_arg.into()]);
    if audio_arg == "aac" {
        args.extend(["-b:a".into(), "192k".into()]);
    }
    args.extend([
        "-movflags".into(),
        "+faststart".into(),
        "-progress".into(),
        "pipe:2".into(), // FFmpeg writes key=value progress to stderr
        cache_file.clone(),
    ]);

    let (mut rx, _child) = sidecar
        .args(args)
        .spawn()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    let app_for_progress = app.clone();
    let path_for_progress = video_path.clone();

    while let Some(event) = rx.recv().await {
        if let CommandEvent::Stderr(line) = event {
            let text = String::from_utf8_lossy(&line);
            for part in text.split(['\r', '\n']) {
                if let Some(ms_str) = part.strip_prefix("out_time_ms=") {
                    let percent = match (duration, ms_str.trim().parse::<f64>()) {
                        (Some(dur), Ok(out_ms)) if dur > 0.0 => {
                            ((out_ms / 1_000_000.0) / dur * 100.0).clamp(0.0, 100.0) as f32
                        }
                        _ => -1.0,
                    };
                    app_for_progress
                        .emit(
                            "video-transcode-progress",
                            TranscodeProgress {
                                path: path_for_progress.clone(),
                                percent,
                            },
                        )
                        .ok();
                }
            }
        }
    }

    if !Path::new(&cache_file).exists() {
        app.emit("video-transcode-failed", video_path.clone()).ok();
        log::error!("[VIDEO] Transcode failed for {}", video_path);
        return Err(
            "Transcode failed — this video format may not be supported by FFmpeg, or the file is corrupted."
                .to_string(),
        );
    }

    app.emit("video-transcode-finished", video_path.clone()).ok();
    log::info!("[VIDEO] Transcode finished for {} -> {}", video_path, cache_file);

    Ok(cache_file)
}