// ---------------------------------------- Fitur Lirik ----------------------------------------
//
// Semua logika lirik disatukan di sini (types, query DB, fetch LRCLib, fuzzy
// matching, command Tauri) — sengaja menyimpang dari konvensi umum project
// ("db.rs = semua query", "types.rs = semua struct DB") khusus untuk domain
// ini, karena lirik itu satu tabel mandiri yang tidak disentuh fitur lain
// sama sekali. Tujuannya supaya commands.rs/db.rs tidak makin gemuk.
//
// Alur cache: SQLite adalah cache PERMANEN, bukan cuma cache sesi. `lyrics_id
// == 0` dipakai sebagai sentinel "sudah pernah dicoba, dan memang tidak ada
// lirik ditemukan" — supaya lagu yang liriknya tidak ada di LRCLib tidak
// nembak API lagi setiap kali lagu itu diputar/dibuka widgetnya.

use crate::AppState;
use reqwest::{
    header::{CONTENT_TYPE, USER_AGENT},
    Client,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::{http::HeaderMap, State};
use tauri_plugin_log::log;

// ---------------------------------------- Types ----------------------------------------

/// Baris lirik seperti tersimpan/dipakai di DB & dikirim ke frontend.
/// `lyrics_id == 0` = sentinel "sudah dicek, tidak ada lirik" (lihat catatan di atas).
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct LrclibLyrics {
    pub lyrics_id: i64,
    pub plain_lyrics: String,
    pub synced_lyrics: Option<String>,
}

impl LrclibLyrics {
    fn not_found() -> Self {
        Self {
            lyrics_id: 0,
            plain_lyrics: String::new(),
            synced_lyrics: None,
        }
    }

    fn is_not_found(&self) -> bool {
        self.lyrics_id == 0
    }
}

#[derive(sqlx::FromRow, Clone)]
struct SongLyricsMeta {
    artist: String,
    album: String,
    name: String,
    duration: u64,
}

/// Bentuk respons resmi endpoint `/api/get` LRCLib (exact-match by durasi).
/// `#[serde(default)]` di level struct penting: kalau LRCLib balikin body
/// error (404 track not found, dsb — field-nya beda sama sekali), semua
/// field jatuh ke default (id=0) alih-alih gagal deserialize / panic.
#[derive(Deserialize, Default, Clone)]
#[serde(default, rename_all = "camelCase")]
struct LrclibGetResponse {
    id: i64,
    plain_lyrics: Option<String>,
    synced_lyrics: Option<String>,
    duration: Option<f64>,
}

// (konversi ke LrclibLyrics sekarang dilakukan manual di fetch_exact_lyrics,
// setelah durasi divalidasi — lihat catatan di sana)

/// Bentuk satu hasil endpoint `/api/search` LRCLib (fuzzy, banyak kandidat).
#[derive(Clone, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct LrclibSearchResult {
    id: i64,
    track_name: Option<String>,
    artist_name: Option<String>,
    album_name: Option<String>,
    plain_lyrics: Option<String>,
    synced_lyrics: Option<String>,
    duration: Option<f64>,
    instrumental: Option<bool>,
}

/// Kandidat yang dikirim ke frontend saat confidence tidak cukup tinggi
/// untuk auto-accept, dan user perlu memilih sendiri.
#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LyricsCandidate {
    pub id: i64,
    pub track_name: Option<String>,
    pub artist_name: Option<String>,
    pub album_name: Option<String>,
    pub duration: Option<f64>,
    pub instrumental: Option<bool>,
    pub plain_lyrics: Option<String>,
    pub synced_lyrics: Option<String>,
    pub confidence: f64,
}

#[derive(Clone, Serialize, Debug)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum LyricsLookupResult {
    Cached { lyrics: LrclibLyrics },
    AutoMatched { lyrics: LrclibLyrics },
    NeedsSelection { candidates: Vec<LyricsCandidate> },
    NotFound,
}

// ---------------------------------------- Konstanta ----------------------------------------

/// Di atas angka ini, kandidat langsung dipakai tanpa tanya user.
const LYRICS_AUTO_ACCEPT_THRESHOLD: f64 = 95.0;
/// Maksimal kandidat yang dikirim ke frontend saat butuh pilihan user.
const LYRICS_MAX_CANDIDATES: usize = 8;
/// Timeout request ke LRCLib — offline-first app tidak boleh nge-hang lama
/// nunggu koneksi yang mungkin memang tidak ada.
const LRCLIB_TIMEOUT_SECS: u64 = 8;
/// Sanity check untuk endpoint exact-match: kalau LRCLib balikin hasil yang
/// durasinya beda lebih dari ini (detik) dari file lokal, JANGAN dipakai
/// langsung — anggap bukan match yang benar dan lempar ke fuzzy search
/// (yang punya scoring lebih ketat). Endpoint /api/get sejatinya harusnya
/// exact, tapi ternyata bisa saja tetap balikin rekaman lain (mis. radio
/// edit vs versi album) yang judul+artis-nya identik tapi durasi jomplang —
/// tanpa cek ini, itu langsung diterima mentah-mentah.
const EXACT_MATCH_DURATION_TOLERANCE_SECS: f64 = 5.0;

/// Kata-kata yang menandakan varian rekaman berbeda (live/remix/dst) — dipakai
/// untuk mendeteksi "judul kelihatan sama tapi ini sebenarnya rekaman berbeda".
const VARIANT_MARKERS: &[&str] = &[
    "live",
    "remix",
    "acoustic",
    "instrumental",
    "karaoke",
    "demo",
    "remaster",
    "remastered",
    "extended",
    "edit",
    "version",
    "mix",
    "deluxe",
    "session",
    "cover",
    "unplugged",
    "reprise",
    "bonus",
];

// ---------------------------------------- HTTP client ----------------------------------------

fn lrclib_client() -> Result<Client, String> {
    let mut headers = HeaderMap::new();
    headers.insert(
        CONTENT_TYPE,
        "application/x-www-form-urlencoded".parse().unwrap(),
    );
    headers.insert(USER_AGENT, "Michie Music Player".parse().unwrap());

    Client::builder()
        .default_headers(headers)
        .timeout(Duration::from_secs(LRCLIB_TIMEOUT_SECS))
        .build()
        .map_err(|e| format!("Failed to build LRCLib HTTP client: {e}"))
}

// ---------------------------------------- Fuzzy matching ----------------------------------------

fn normalize_for_match(s: &str) -> String {
    let lower = s.to_lowercase();
    let mut cleaned = String::with_capacity(lower.len());
    for c in lower.chars() {
        if c.is_alphanumeric() || c.is_whitespace() {
            cleaned.push(c);
        } else if c == '&' {
            cleaned.push_str(" and ");
        } else {
            cleaned.push(' ');
        }
    }
    cleaned.split_whitespace().collect::<Vec<_>>().join(" ")
}

// Ambil kata penanda varian yang muncul di judul (setelah dinormalisasi)
fn extract_variant_tags(normalized_title: &str) -> std::collections::BTreeSet<&'static str> {
    let mut tags = std::collections::BTreeSet::new();
    for marker in VARIANT_MARKERS {
        if normalized_title.split_whitespace().any(|w| w == *marker) {
            tags.insert(*marker);
        }
    }
    tags
}

// Buang kata penanda varian + "feat/ft/featuring" supaya judul inti bisa
// dibandingkan apple-to-apple, terlepas dari embel-embel versi.
fn strip_noise_words(normalized_title: &str) -> String {
    normalized_title
        .split_whitespace()
        .filter(|w| !VARIANT_MARKERS.contains(w) && *w != "feat" && *w != "ft" && *w != "featuring")
        .collect::<Vec<_>>()
        .join(" ")
}

fn text_similarity(a: &str, b: &str) -> f64 {
    let na = normalize_for_match(a);
    let nb = normalize_for_match(b);
    if na.is_empty() && nb.is_empty() {
        return 1.0;
    }
    if na.is_empty() || nb.is_empty() {
        return 0.0;
    }
    if na == nb {
        return 1.0;
    }
    strsim::jaro_winkler(&na, &nb)
}

// Beda durasi <=2 detik dianggap identik, >=12 detik dianggap tidak cocok.
fn duration_similarity(song_duration: u64, candidate_duration: Option<f64>) -> Option<f64> {
    candidate_duration.map(|cd| {
        let diff = (song_duration as f64 - cd).abs();
        if diff <= 2.0 {
            1.0
        } else if diff >= 12.0 {
            0.0
        } else {
            1.0 - ((diff - 2.0) / 10.0)
        }
    })
}

// Judul (inti, tanpa embel varian) + artis + durasi + album (kalau ada) -> confidence,
// lalu dipangkas kalau status varian (live/remix/dst) beda antara lokal & kandidat.
fn compute_confidence(
    song_name: &str,
    song_artist: &str,
    song_album: &str,
    song_duration: u64,
    cand_name: &str,
    cand_artist: &str,
    cand_album: Option<&str>,
    cand_duration: Option<f64>,
) -> f64 {
    let song_name_norm = normalize_for_match(song_name);
    let cand_name_norm = normalize_for_match(cand_name);

    let song_core = strip_noise_words(&song_name_norm);
    let cand_core = strip_noise_words(&cand_name_norm);
    let title_sim = text_similarity(&song_core, &cand_core);
    let artist_sim = text_similarity(song_artist, cand_artist);

    let mut weighted_sum = title_sim * 0.35 + artist_sim * 0.30;
    let mut total_weight = 0.65_f64;

    if !song_album.is_empty() {
        if let Some(cand_album) = cand_album.filter(|a| !a.is_empty()) {
            weighted_sum += text_similarity(song_album, cand_album) * 0.10;
            total_weight += 0.10;
        }
    }

    if let Some(duration_sim) = duration_similarity(song_duration, cand_duration) {
        weighted_sum += duration_sim * 0.25;
        total_weight += 0.25;
    }

    if total_weight <= 0.0 {
        return 0.0;
    }

    let mut confidence = (weighted_sum / total_weight) * 100.0;

    let song_tags = extract_variant_tags(&song_name_norm);
    let cand_tags = extract_variant_tags(&cand_name_norm);
    if song_tags != cand_tags {
        confidence *= 0.55;
    }

    confidence.clamp(0.0, 100.0)
}

// ---------------------------------------- Fetch LRCLib ----------------------------------------

// Endpoint exact-match resmi LRCLib — authoritative, toleransi durasi dihitung
// di server mereka. lyrics_id == 0 berarti "tidak ketemu" (baik karena LRCLib
// balikin 404, maupun karena body-nya memang kosong) — BUKAN error jaringan;
// error jaringan/parsing tetap di-propagate lewat Err supaya caller tahu
// bedanya "sudah dicek, tidak ada" vs "belum sempat dicek".
async fn fetch_exact_lyrics(
    client: &Client,
    name: &str,
    artist: &str,
    album: &str,
    duration: u64,
) -> Result<LrclibLyrics, String> {
    let url = format!(
        "https://lrclib.net/api/get?artist_name={}&track_name={}&album_name={}&duration={}",
        urlencoding::encode(artist),
        urlencoding::encode(name),
        urlencoding::encode(album),
        duration
    );

    let response = client.get(&url).send().await.map_err(|e| {
        log::error!("Lyrics - exact match request failed: {e:?}");
        "Error contacting LRCLib".to_string()
    })?;

    let parsed = response
        .json::<LrclibGetResponse>()
        .await
        .map_err(|e| {
            log::error!("Lyrics - exact match parse failed: {e:?}");
            "Error parsing LRCLib response".to_string()
        })?;

    // id == 0 -> memang tidak ketemu (lihat catatan default di struct), aman
    // langsung dianggap not_found tanpa perlu cek durasi.
    if parsed.id == 0 {
        return Ok(LrclibLyrics::not_found());
    }

    // Sanity check durasi: endpoint ini seharusnya exact-match, tapi kalau
    // ternyata durasi hasilnya jomplang jauh dari file lokal, JANGAN dipakai —
    // biar caller jatuh ke fuzzy search yang scoring-nya lebih ketat, alih-alih
    // diam-diam mengunci ke rekaman/versi yang salah untuk seluruh lagu.
    if let Some(returned_duration) = parsed.duration {
        let diff = (duration as f64 - returned_duration).abs();
        if diff > EXACT_MATCH_DURATION_TOLERANCE_SECS {
            log::info!(
                "Lyrics - exact match rejected (duration mismatch {duration}s vs {returned_duration}s) for {name}"
            );
            return Ok(LrclibLyrics::not_found());
        }
    }

    Ok(LrclibLyrics {
        lyrics_id: parsed.id,
        plain_lyrics: parsed.plain_lyrics.unwrap_or_default(),
        synced_lyrics: parsed.synced_lyrics,
    })
}

// Pencarian LRCLib — sengaja TANPA album_name di query supaya tidak terlalu
// ketat menyaring; album tetap dipakai nanti pas hitung confidence, bukan di sini.
async fn search_lyrics_candidates(
    client: &Client,
    track_name: &str,
    artist_name: Option<&str>,
) -> Result<Vec<LrclibSearchResult>, String> {
    let url = match artist_name {
        Some(artist) => format!(
            "https://lrclib.net/api/search?track_name={}&artist_name={}",
            urlencoding::encode(track_name),
            urlencoding::encode(artist),
        ),
        None => format!(
            "https://lrclib.net/api/search?track_name={}",
            urlencoding::encode(track_name),
        ),
    };

    let response = client.get(&url).send().await.map_err(|e| {
        log::error!("Lyrics - search request failed: {e:?}");
        "Error searching LRCLib".to_string()
    })?;

    response.json::<Vec<LrclibSearchResult>>().await.map_err(|e| {
        log::error!("Lyrics - search parse failed: {e:?}");
        "Error parsing LRCLib search response".to_string()
    })
}

// ---------------------------------------- DB ----------------------------------------

// Upsert atomik — satu statement untuk kasus "belum ada row" maupun "sudah
// ada, perlu diganti", jadi tidak ada jendela race antara cek-lalu-tulis.
// Butuh UNIQUE(song_id) di skema tabel `lyrics` (lihat migration).
async fn upsert_lyrics(
    state: &State<'_, AppState>,
    song_path: &str,
    lyrics: &LrclibLyrics,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO lyrics (song_id, lyrics_id, plain_lyrics, synced_lyrics, fetched_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(song_id) DO UPDATE SET
            lyrics_id = excluded.lyrics_id,
            plain_lyrics = excluded.plain_lyrics,
            synced_lyrics = excluded.synced_lyrics,
            fetched_at = excluded.fetched_at",
    )
    .bind(song_path)
    .bind(lyrics.lyrics_id)
    .bind(&lyrics.plain_lyrics)
    .bind(&lyrics.synced_lyrics)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        log::error!("Lyrics - failed to upsert cache for {song_path}: {e:?}");
        "Failed to save lyrics to cache".to_string()
    })?;

    Ok(())
}

async fn get_cached_lyrics(
    state: &State<'_, AppState>,
    song_path: &str,
) -> Option<LrclibLyrics> {
    sqlx::query_as::<_, (i64, String, Option<String>)>(
        "SELECT lyrics_id, plain_lyrics, synced_lyrics FROM lyrics WHERE song_id = ?1",
    )
    .bind(song_path)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten()
    .map(|(lyrics_id, plain_lyrics, synced_lyrics)| LrclibLyrics {
        lyrics_id,
        plain_lyrics,
        synced_lyrics,
    })
}

// ---------------------------------------- Commands ----------------------------------------

/// Command lama, dipertahankan untuk kompatibilitas (dipanggil dari
/// `lyricsService.getLyrics`, walau widget saat ini pakai `find_lyrics_candidates`).
/// Beda dengan cache internal: ini mengembalikan Err kalau belum pernah dicek
/// ATAU kalau sudah dicek tapi memang tidak ada (sentinel) — supaya kontrak
/// lama "Err = tidak ada lirik" tidak berubah untuk caller manapun yang masih pakai ini.
#[tauri::command(rename_all = "snake_case")]
pub async fn get_lyrics(state: State<AppState, '_>, song_id: String) -> Result<LrclibLyrics, String> {
    match get_cached_lyrics(&state, &song_id).await {
        Some(lyrics) if !lyrics.is_not_found() => Ok(lyrics),
        _ => {
            log::info!("Song does not have lyrics in the database");
            Err("No Lyrics".to_string())
        }
    }
}

/// Cari lirik manual berdasarkan judul+album (dipakai kalau user mau cari ulang).
#[tauri::command(rename_all = "snake_case")]
pub async fn search_remote_lyrics(
    name: String,
    album: String,
) -> Result<Vec<LrclibSearchResultPublic>, String> {
    let client = lrclib_client()?;
    let url = format!(
        "https://lrclib.net/api/search?track_name={}&album_name={}",
        urlencoding::encode(&name),
        urlencoding::encode(&album),
    );

    let response = client.get(&url).send().await.map_err(|e| {
        log::error!("Lyrics - manual search request failed: {e:?}");
        "Error Searching for Remote Lyrics".to_string()
    })?;

    let results = response.json::<Vec<LrclibSearchResult>>().await.map_err(|e| {
        log::error!("Lyrics - manual search parse failed: {e:?}");
        "Error Parsing Remote Lyrics".to_string()
    })?;

    Ok(results.into_iter().map(Into::into).collect())
}

/// Simpan pilihan lirik user (dari candidate picker) ke cache permanen.
#[tauri::command(rename_all = "snake_case")]
pub async fn update_remote_lyrics(
    state: State<AppState, '_>,
    path: String,
    plain_lyrics: String,
    synced_lyrics: String,
    lyrics_id: i64,
) -> Result<(), String> {
    let lyrics = LrclibLyrics {
        lyrics_id,
        plain_lyrics,
        synced_lyrics: if synced_lyrics.trim().is_empty() {
            None
        } else {
            Some(synced_lyrics)
        },
    };
    upsert_lyrics(&state, &path, &lyrics).await
}

/// Command utama widget lirik: cache -> exact-match resmi LRCLib -> fuzzy
/// search bertingkat -> auto-pakai kalau sangat yakin, atau minta user pilih.
#[tauri::command(rename_all = "snake_case")]
pub async fn find_lyrics_candidates(
    state: State<AppState, '_>,
    song_id: String,
) -> Result<LyricsLookupResult, String> {
    // 1. Cache SQLite dulu — termasuk sentinel "sudah dicek, tidak ada".
    if let Some(lyrics) = get_cached_lyrics(&state, &song_id).await {
        if lyrics.is_not_found() {
            return Ok(LyricsLookupResult::NotFound);
        }
        return Ok(LyricsLookupResult::Cached { lyrics });
    }

    // 2. Ambil metadata lagu dari DB.
    let song = sqlx::query_as::<_, SongLyricsMeta>(
        "SELECT artist, album, name, duration FROM songs WHERE path = ?1",
    )
    .bind(&song_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| "Song Not Found".to_string())?;

    let client = lrclib_client()?;

    // 3. Coba endpoint exact-match dulu. Kalau gagal karena jaringan, JANGAN
    // cache apa pun — biarkan dicoba lagi lain kali. Kalau berhasil dihubungi
    // tapi memang tidak ketemu (lyrics_id == 0), lanjut ke fuzzy search di
    // bawah — exact-match cukup ketat soal durasi, fuzzy search bisa lebih toleran.
    if let Ok(exact) = fetch_exact_lyrics(&client, &song.name, &song.artist, &song.album, song.duration).await {
        if !exact.is_not_found() {
            let _ = upsert_lyrics(&state, &song_id, &exact).await;
            return Ok(LyricsLookupResult::AutoMatched { lyrics: exact });
        }
    }

    // 4. Fuzzy search — track+artist dulu, kalau kosong baru coba track name saja.
    let mut results = search_lyrics_candidates(&client, &song.name, Some(&song.artist)).await?;
    if results.is_empty() {
        results = search_lyrics_candidates(&client, &song.name, None).await?;
    }

    if results.is_empty() {
        let _ = upsert_lyrics(&state, &song_id, &LrclibLyrics::not_found()).await;
        return Ok(LyricsLookupResult::NotFound);
    }

    // 5. Hitung confidence tiap kandidat.
    let mut candidates: Vec<LyricsCandidate> = results
        .into_iter()
        .filter(|r| !(r.plain_lyrics.is_none() && r.synced_lyrics.is_none()) || r.instrumental == Some(true))
        .map(|r| {
            let confidence = compute_confidence(
                &song.name,
                &song.artist,
                &song.album,
                song.duration,
                r.track_name.as_deref().unwrap_or(""),
                r.artist_name.as_deref().unwrap_or(""),
                r.album_name.as_deref(),
                r.duration,
            );
            LyricsCandidate {
                id: r.id,
                track_name: r.track_name,
                artist_name: r.artist_name,
                album_name: r.album_name,
                duration: r.duration,
                instrumental: r.instrumental,
                plain_lyrics: r.plain_lyrics,
                synced_lyrics: r.synced_lyrics,
                confidence,
            }
        })
        .collect();

    if candidates.is_empty() {
        let _ = upsert_lyrics(&state, &song_id, &LrclibLyrics::not_found()).await;
        return Ok(LyricsLookupResult::NotFound);
    }

    candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    if let Some(best) = candidates.first() {
        if best.confidence >= LYRICS_AUTO_ACCEPT_THRESHOLD {
            let lyrics = LrclibLyrics {
                lyrics_id: best.id,
                plain_lyrics: best.plain_lyrics.clone().unwrap_or_default(),
                synced_lyrics: best.synced_lyrics.clone(),
            };
            let _ = upsert_lyrics(&state, &song_id, &lyrics).await;
            return Ok(LyricsLookupResult::AutoMatched { lyrics });
        }
    }

    candidates.truncate(LYRICS_MAX_CANDIDATES);
    Ok(LyricsLookupResult::NeedsSelection { candidates })
}

// ---------------------------------------- Kompat untuk search_remote_lyrics lama ----------------------------------------

/// Bentuk hasil pencarian manual (dipertahankan biar signature command lama
/// tidak berubah untuk caller yang masih memakainya).
#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LrclibSearchResultPublic {
    pub id: i64,
    pub track_name: Option<String>,
    pub artist_name: Option<String>,
    pub album_name: Option<String>,
    pub plain_lyrics: Option<String>,
    pub synced_lyrics: Option<String>,
    pub duration: Option<f64>,
    pub instrumental: Option<bool>,
}

impl From<LrclibSearchResult> for LrclibSearchResultPublic {
    fn from(r: LrclibSearchResult) -> Self {
        Self {
            id: r.id,
            track_name: r.track_name,
            artist_name: r.artist_name,
            album_name: r.album_name,
            plain_lyrics: r.plain_lyrics,
            synced_lyrics: r.synced_lyrics,
            duration: r.duration,
            instrumental: r.instrumental,
        }
    }
}