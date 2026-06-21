pub const CREATE_TABLES: &str = r#"
CREATE TABLE IF NOT EXISTS tracks (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    artist       TEXT NOT NULL DEFAULT 'Unknown Artist',
    album        TEXT NOT NULL DEFAULT 'Unknown Album',
    album_artist TEXT,
    duration     REAL NOT NULL DEFAULT 0,
    file_path    TEXT NOT NULL UNIQUE,
    artwork_path TEXT,
    track_number INTEGER,
    year         INTEGER,
    genre        TEXT,
    bitrate      INTEGER,
    sample_rate  INTEGER,
    date_added   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist     ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album      ON tracks(album);
CREATE INDEX IF NOT EXISTS idx_tracks_date_added ON tracks(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_file_path  ON tracks(file_path);

CREATE VIEW IF NOT EXISTS albums AS
SELECT
    album                    AS title,
    COALESCE(album_artist, artist) AS artist,
    MIN(artwork_path)        AS artwork_path,
    MAX(year)                AS year,
    COUNT(*)                 AS track_count
FROM tracks
GROUP BY album, COALESCE(album_artist, artist);
"#;