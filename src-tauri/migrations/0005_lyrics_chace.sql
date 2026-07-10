-- Rebuild tabel lyrics — menggantikan skema dari 0003_lyrics_chace.sql.
--
-- Cache permanen untuk lirik (sumber: LRCLib, https://lrclib.net).
--
-- DROP + CREATE (bukan ALTER) karena tabel lyrics versi 0003 berisi data
-- yang korup (bug parsing JSON di implementasi lama menyimpan lirik dengan
-- tanda kutip nyangkut + newline literal "\n" alih-alih baris baru asli).
-- Aman di-drop karena sifatnya cache — akan terisi ulang otomatis saat lagu
-- dibuka lagi lewat widget lirik. Dijalankan sebagai 0005 (setelah 0004)
-- supaya urutan migration tetap linear, bukan menimpa file 0003 yang lama.
--
-- lyrics_id = 0 dipakai sebagai sentinel "sudah pernah dicek, memang tidak
-- ada lirik ditemukan di LRCLib" (bukan berarti baris kosong/belum dicek).
--
-- UNIQUE(song_id) WAJIB ada — dipakai oleh `INSERT ... ON CONFLICT(song_id)
-- DO UPDATE` di lyrics.rs untuk upsert atomik (menghindari race antara
-- baca-lalu-tulis yang ada di implementasi lama).

DROP TABLE IF EXISTS lyrics;

CREATE TABLE lyrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT NOT NULL UNIQUE,        -- path lagu (samakan pola dengan tabel lain, bukan song.id)
    lyrics_id INTEGER NOT NULL DEFAULT 0, -- id dari LRCLib; 0 = sentinel "dicek, tidak ketemu"
    plain_lyrics TEXT NOT NULL DEFAULT '',
    synced_lyrics TEXT,                   -- raw LRC text (format [mm:ss.xx]teks), NULL kalau tidak ada versi tersinkron
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);