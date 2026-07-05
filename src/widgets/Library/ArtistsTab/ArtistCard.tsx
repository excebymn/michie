import React from 'react';
import { ArtistAvatar } from '../common/ArtistAvatar';
import type { AllArtistResults } from '../../../globalValues';

interface ArtistCardProps {
  artist: AllArtistResults;
  coverPath?: string | null;
  onClick: (artist: AllArtistResults) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, coverPath, onClick }) => {
  return (
    <div onClick={() => onClick(artist)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: 140 }}>
      <ArtistAvatar path={coverPath} name={artist.album_artist} size={140} />
      <div style={{ fontSize: '0.9rem', fontWeight: 500, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
        {artist.album_artist}
      </div>
    </div>
  );
};