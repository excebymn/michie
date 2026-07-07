import React from 'react';
import { SourcePicker } from '../SourcePicker';
import { LibraryView } from '../Library';
import { AppearancePanel } from '../Appearance';
import { QueueView } from '../Queue';
import { PlaylistsView } from '../Playlists';

export interface SettingsPanelConfig {
  id: string;
  label: string;
  component: React.FC;
}

export const settingsRegistry: SettingsPanelConfig[] = [
  { id: 'queue', label: 'Queue', component: QueueView },
  { id: 'source', label: 'Directory source', component: SourcePicker },
  { id: 'library', label: 'Music library', component: LibraryView },
  { id: 'playlists', label: 'Playlists', component: PlaylistsView },
  { id: 'appearance', label: 'Appearance', component: AppearancePanel },
];