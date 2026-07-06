import React from 'react';
import type { AllGenreResults } from '../../../globalValues';

const hashToHue = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

interface GenreCardProps {
  genre: AllGenreResults;
  onClick: (genre: AllGenreResults) => void;
}

export const GenreCard: React.FC<GenreCardProps> = ({ genre, onClick }) => {
  const hue = hashToHue(genre.genre || 'genre');

  return (
    <div
      onClick={() => onClick(genre)}
      className="michie-box"
      style={{
        width: 160,
        height: 100,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'flex-end',
        padding: 14,
        cursor: 'pointer',
        background: `linear-gradient(135deg, hsl(${hue}, 45%, 24%), hsl(${hue}, 45%, 14%))`,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{genre.genre}</span>
    </div>
  );
};