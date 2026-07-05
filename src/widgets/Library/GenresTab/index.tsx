import React, { useCallback } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { playerService } from '../../../services/playerService';
import { SearchBar } from '../common/SearchBar';
import { GenreCard } from './GenreCard';
import { useLibrarySearch } from '../useLibrarySearch';
import { normalizeForSearch } from '../../../utils/normalize';
import type { AllGenreResults } from '../../../globalValues';

export const GenresTab: React.FC = () => {
  const genreList = useAppStore((s) => s.genreList);

  const { query, setQuery, filtered } = useLibrarySearch<AllGenreResults>(genreList, (genre, q) =>
    normalizeForSearch(genre.genre).includes(q)
  );

  const handleOpenGenre = useCallback((genre: AllGenreResults) => {
    playerService.playGenre(genre.genre, false);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Cari genre..." />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>Tidak ada genre ditemukan.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {filtered.map((genre) => (
              <GenreCard key={genre.genre} genre={genre} onClick={handleOpenGenre} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};