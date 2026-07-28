-- Menambahkan kolom penanda "user sudah pernah lihat popup Manual/cara pakai".
-- Ikut pola persis kolom lain di tabel settings (mis. discord_rp_enabled):
-- satu baris (id = 1), default 0/false. Untuk user yang sudah pernah install
-- app sebelum migration ini ada, kolom ini otomatis ke-set 0 juga -- artinya
-- popup Manual akan tampil sekali untuk mereka juga, bukan cuma install baru.
-- Ini disengaja/wajar untuk fitur yang baru ditambahkan belakangan.
ALTER TABLE settings ADD COLUMN has_seen_manual BOOLEAN NOT NULL DEFAULT 0;