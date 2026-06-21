use lofty::prelude::*;
use lofty::probe::Probe;
use std::path::Path;
use anyhow::Result;
use uuid::Uuid;
use crate::state::Track;

pub fn extract_metadata(file_path: &str) -> Result<Track> {
    let path = Path::new(file_path);
    let tagged = Probe::open(path)?.read()?;
    let props = tagged.properties();
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());

    let title = tag.and_then(|t| t.title().map(|s| s.to_string()))
        .unwrap_or_else(|| path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string());

    Ok(Track {
        id:           Uuid::new_v4().to_string(),
        title,
        artist:       tag.and_then(|t| t.artist().map(|s|s.to_string())).unwrap_or_else(||"Unknown Artist".to_string()),
        album:        tag.and_then(|t| t.album().map(|s|s.to_string())).unwrap_or_else(||"Unknown Album".to_string()),
        album_artist: tag.and_then(|t| t.get_string(&ItemKey::AlbumArtist).map(|s|s.to_string())),
        duration:     props.duration().as_secs_f64(),
        file_path:    file_path.to_string(),
        artwork_path: None,
        track_number: tag.and_then(|t| t.track()),
        year:         tag.and_then(|t| t.year()),
        genre:        tag.and_then(|t| t.genre().map(|s|s.to_string())),
        bitrate:      props.audio_bitrate(),
        sample_rate:  props.sample_rate(),
        date_added:   chrono::Utc::now().timestamp(),
    })
}

pub fn extract_artwork_bytes(file_path: &str) -> Result<Option<Vec<u8>>> {
    let tagged = Probe::open(Path::new(file_path))?.read()?;
    Ok(tagged.primary_tag()
        .or_else(|| tagged.first_tag())
        .and_then(|t| t.pictures().first())
        .map(|p| p.data().to_vec()))
}