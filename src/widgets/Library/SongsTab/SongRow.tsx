import React from 'react';
import { AlbumArt } from '../common/AlbumArt';
import type { SongsFull } from '../../../globalValues';

interface SongRowProps {
  song: SongsFull;
  onPlay: (song: SongsFull) => void;
}

const formatDuration = (seconds: number) => new Date(seconds * 1000).toISOString().slice(14, 19);

export const SongRow: React.FC<SongRowProps> = ({ song, onPlay }) => {
  return (
    <div
      onDoubleClick={() => onPlay(song)}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 2fr 1.3fr 1.3fr 70px',
        alignItems: 'center',
        gap: 14,
        padding: '8px 12px',
        borderRadius: 10,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <AlbumArt path={song.cover} alt={song.album} size={44} rounded={8} />

      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.name}
        </div>
        <div style={{ fontSize: '0.78rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.artist}
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {song.album}
      </div>

      <div style={{ fontSize: '0.85rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {song.genre}
      </div>

      <div style={{ fontSize: '0.85rem', opacity: 0.6, textAlign: 'right' }}>
        {formatDuration(song.duration)}
      </div>
    </div>
  );
};