-- 0004_add_audio_info.sql
-- Menambahkan metadata teknis audio ke tabel `songs`, dipakai untuk
-- menampilkan info kualitas file (mis. "FLAC · 44.1kHz · 1411kbps") di UI.
--
-- - sample_rate: dalam Hz (contoh: 44100, 48000, 96000)
-- - bit_rate:    dalam bps (contoh: 1411000 untuk FLAC CD-quality, 320000 untuk MP3 320kbps)
-- - format:      ekstensi/codec singkat (contoh: "flac", "mp3", "ogg", "wav", "m4a")
--
-- Nullable & tanpa DEFAULT: baris lama (lagu yang sudah discan sebelum
-- migration ini) akan bernilai NULL sampai directory-nya di-rescan ulang —
-- itu sebabnya di sisi Rust field-field ini dibungkus Option<..> dan
-- ditandai #[sqlx(default)], dan di sisi TypeScript dibuat optional (?).
-- Rescan otomatis mengisi nilainya lewat scan_directory -> get_song_data
-- (lihat helper.rs) begitu ekstraksi metadata sudah diimplementasikan.

ALTER TABLE songs ADD COLUMN sample_rate INTEGER;
ALTER TABLE songs ADD COLUMN bit_rate INTEGER;
ALTER TABLE songs ADD COLUMN format TEXT;