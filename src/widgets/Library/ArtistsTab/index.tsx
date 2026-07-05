import React, { useCallback, useMemo } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { playerService } from '../../..//services/playerService';
import { SearchBar } from '../common/SearchBar';
import { ArtistCard } from './ArtistCard';
import { useLibrarySearch } from '../useLibrarySearch';
import { normalizeForSearch } from '../../../utils/normalize';
import type { AllArtistResults } from '../../../globalValues';

export const ArtistsTab: React.FC = () => {
  const artistList = useAppStore((s) => s.artistList);
  const albumList = useAppStore((s) => s.albumList);

  // AllArtistResults tidak punya field cover, jadi kita pinjam cover album
  // pertama milik artist tsb sebagai gambar. Kalau nggak ketemu, ArtistAvatar
  // otomatis fallback ke inisial.
  const coverByArtist = useMemo(() => {
    const map = new Map<string, string>();
    for (const album of albumList) {
      if (!map.has(album.album_artist) && album.cover) {
        map.set(album.album_artist, album.cover);
      }
    }
    return map;
  }, [albumList]);

  const { query, setQuery, filtered } = useLibrarySearch<AllArtistResults>(artistList, (artist, q) =>
    normalizeForSearch(artist.album_artist).includes(q)
  );

  const handleOpenArtist = useCallback((artist: AllArtistResults) => {
    playerService.playArtist(artist.album_artist, false);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Cari artis..." />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>Tidak ada artis ditemukan.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {filtered.map((artist) => (
              <ArtistCard
                key={artist.album_artist}
                artist={artist}
                coverPath={coverByArtist.get(artist.album_artist)}
                onClick={handleOpenArtist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};