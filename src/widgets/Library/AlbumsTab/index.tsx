import React, { useCallback } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { playerService } from '../../../services/playerService';
import { SearchBar } from '../common/SearchBar';
import { AlbumCard } from './AlbumCard';
import { useLibrarySearch } from '../useLibrarySearch';
import { normalizeForSearch } from '../../../utils/normalize';
import type { AlbumDetails } from '../../../globalValues';

export const AlbumsTab: React.FC = () => {
  const albumList = useAppStore((s) => s.albumList);

  const { query, setQuery, filtered } = useLibrarySearch<AlbumDetails>(albumList, (album, q) =>
    normalizeForSearch(album.album).includes(q) || normalizeForSearch(album.album_artist).includes(q)
  );

  const handleOpenAlbum = useCallback((album: AlbumDetails) => {
    playerService.playAlbum(album.album, 0, false);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Cari album..." />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>Tidak ada album ditemukan.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {filtered.map((album) => (
              <AlbumCard key={`${album.album}-${album.album_artist}`} album={album} onClick={handleOpenAlbum} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};