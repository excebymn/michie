import React, { useCallback } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { playerService } from '../../../services/playerService';
import { SearchBar } from '../common/SearchBar';
import { SongRow } from './SongRow';
import { useLibrarySearch } from '../useLibrarySearch';
import { normalizeForSearch } from '../../../utils/normalize';
import type { SongsFull } from '../../../globalValues';

export const SongsTab: React.FC = () => {
  const songList = useAppStore((s) => s.songList);

  const { query, setQuery, filtered } = useLibrarySearch<SongsFull>(songList, (song, q) =>
    normalizeForSearch(song.name).includes(q) ||
    normalizeForSearch(song.album).includes(q) ||
    normalizeForSearch(song.artist).includes(q)
  );

  const handlePlay = useCallback((song: SongsFull) => {
    playerService.playSong(song);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Cari lagu, album, atau artis..." />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 2fr 1.3fr 1.3fr 70px',
          gap: 14,
          padding: '0 12px',
          fontSize: '0.75rem',
          opacity: 0.5,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        <span />
        <span
        className="michie-text-secondary"
        >Judul</span>
        <span className="michie-text-secondary">Album</span>
        <span className="michie-text-secondary">Genre</span>
        <span className="michie-text-secondary" style={{ textAlign: 'right' }}>
          Durasi
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>Tidak ada lagu ditemukan.</div>
        ) : (
          filtered.map((song) => <SongRow key={song.path} song={song} onPlay={handlePlay} />)
        )}
      </div>
    </div>
  );
};