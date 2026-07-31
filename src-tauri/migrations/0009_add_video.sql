-- Video Player Mode: direktori scan video (terpisah dari `dirs` musik) +
-- tabel video hasil scan. Sengaja dipisah total dari skema musik supaya
-- scan video tidak pernah numpuk / interfere dengan scan musik, dan supaya
-- fitur ini bisa dihapus/di-reset independen kalau perlu.
--
-- `keep` dipakai persis sama polanya seperti `songs.keep` di 0001_init.sql:
-- di-set 0 di awal tiap scan_video_directory, entry yang masih 0 di akhir
-- scan berarti file-nya sudah tidak ketemu lagi -> dihapus.

CREATE TABLE IF NOT EXISTS video_dirs (
    dir_path TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS videos (
    path TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    subtitle_path TEXT,
    keep BOOLEAN NOT NULL DEFAULT 1
);