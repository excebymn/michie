-- Kolom buat toggle Discord Rich Presence di Settings > Integrations.
-- Default 0 (nonaktif) supaya instalasi lama (upgrade dari versi sebelum
-- fitur ini ada) tidak tiba-tiba mulai connect ke Discord tanpa user minta.
ALTER TABLE settings ADD COLUMN discord_rp_enabled BOOLEAN NOT NULL DEFAULT 0;