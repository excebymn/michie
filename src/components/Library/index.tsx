import React, { useState } from 'react';
import { Tabs } from './common/Tabs';
import { SongsTab } from './SongsTab';
import { AlbumsTab } from './AlbumsTab';
import { ArtistsTab } from './ArtistsTab';
import { GenresTab } from './GenresTab';

const TABS = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
  { id: 'genres', label: 'Genres' },
];

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('songs');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'songs' && <SongsTab />}
        {activeTab === 'albums' && <AlbumsTab />}
        {activeTab === 'artists' && <ArtistsTab />}
        {activeTab === 'genres' && <GenresTab />}
      </div>
    </div>
  );
};