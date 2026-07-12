-- Perluasan tabel spectral_analysis (dari 0006_spectral_analysis.sql) untuk
-- menyimpan dataset grafik, bukan cuma metrik skalar.
--
-- Kenapa ditambah lewat ALTER, bukan DROP+CREATE seperti 0005_lyrics_chace.sql:
-- baris lama (hasil scan sebelum migration ini) masih valid untuk widget
-- metrik skalar yang sudah ada (SpectralAnalysis.tsx) -- gak perlu dihapus.
-- Widget baru (grafik) tinggal cek kolom *_json ini NULL atau tidak untuk
-- tau apakah lagu itu perlu di-"Scan Ulang" supaya dapet dataset grafiknya.
--
-- Semua kolom di bawah nullable & berisi JSON mentah (bukan tabel relasional
-- terpisah) -- data ini murni buat digambar ulang di frontend, tidak pernah
-- di-query per-field dari SQL, jadi TEXT/JSON blob adalah pilihan yang tepat
-- di sini (sama seperti pola cover/path yang disimpan sebagai TEXT di tabel
-- songs, bukan didekomposisi jadi tabel lain).

ALTER TABLE spectral_analysis ADD COLUMN spectrum_curve_json TEXT;
ALTER TABLE spectral_analysis ADD COLUMN spectrogram_json TEXT;
ALTER TABLE spectral_analysis ADD COLUMN waveform_json TEXT;
ALTER TABLE spectral_analysis ADD COLUMN stereo_correlation_json TEXT;