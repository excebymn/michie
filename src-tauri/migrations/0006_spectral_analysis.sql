-- Cache hasil analisis spektral per lagu (fitur widget "Analisis Spektral").
--
-- Analisis ini SENGAJA tidak otomatis jalan saat scan_directory() — berat di
-- CPU (decode penuh + FFT ribuan frame per lagu) — jadi cuma dipicu manual
-- lewat tombol "Scan" di widget (lihat spectral::analyze_song_spectrum di
-- src-tauri/src/spectral.rs). Tabel ini murni cache: kalau baris untuk
-- song_path tertentu ada, widget tinggal baca; kalau belum ada, widget
-- nampilin tombol scan.
--
-- UNIQUE(song_path) WAJIB ada — dipakai oleh `INSERT ... ON CONFLICT(song_path)
-- DO UPDATE` di spectral.rs untuk upsert atomik (pola sama seperti tabel
-- `lyrics` di 0005_lyrics_chace.sql).
--
-- Sengaja pakai song_path (bukan FOREIGN KEY ke songs.path) — mengikuti pola
-- yang sudah ada di tabel lyrics, supaya baris cache tetap aman walau baris
-- di tabel songs dihapus/di-rescan (mis. saat scan_for_deleted berjalan),
-- dan tidak butuh migrasi skema tambahan buat tambah constraint FK baru.

CREATE TABLE IF NOT EXISTS spectral_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_path TEXT NOT NULL UNIQUE,
    peak_frequency_hz REAL NOT NULL,
    freq_min_hz REAL NOT NULL,
    freq_max_hz REAL NOT NULL,
    dynamic_range_db REAL NOT NULL,
    spectral_cutoff_hz REAL NOT NULL,
    likely_transcoded INTEGER NOT NULL DEFAULT 0, -- boolean 0/1, lihat heuristik di spectral.rs
    analyzed_at TEXT NOT NULL DEFAULT (datetime('now'))
);