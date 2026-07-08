CREATE TABLE IF NOT EXISTS lyrics (
    song_id TEXT PRIMARY KEY NOT NULL REFERENCES songs(path) ON DELETE CASCADE,
    lyrics_id INTEGER NOT NULL,
    plain_lyrics TEXT NOT NULL DEFAULT '',
    synced_lyrics TEXT
);