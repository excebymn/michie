import React from 'react';
import { SourcePicker } from '../SourcePicker';
import { LibraryView } from '../Library';
import { AppearancePanel } from '../Appearance';
import { QueueView } from '../Queue';
import { PlaylistsView } from '../Playlists';
import { ModePanel } from '../Modes';
import { IntegrationsPanel } from '../Integrations';
import { ShortcutsPanel } from '../Shortcuts';
import { AboutPanel } from '../About';
import { ManualPanel } from '../Manual';
import { VersionPanel } from '../Version';

export interface SettingsPanelConfig {
  id: string;
  label: string;
  component: React.FC;
}

export const settingsRegistry: SettingsPanelConfig[] = [
  { id: 'queue', label: 'Queue', component: QueueView },
  { id: 'source', label: 'Source', component: SourcePicker },
  { id: 'library', label: 'Library', component: LibraryView },
  { id: 'playlists', label: 'Playlists', component: PlaylistsView },
  { id: 'appearance', label: 'Appearance', component: AppearancePanel },
  { id: 'shortcuts', label: 'Shortcuts', component: ShortcutsPanel },
  { id: 'mode', label: 'Modes', component: ModePanel },
  { id: 'integrations', label: 'Integrations', component: IntegrationsPanel },
  { id: 'about', label: 'About', component: AboutPanel },
  { id: 'manual', label: 'Manual', component: ManualPanel },
  { id: 'version', label: 'Version', component: VersionPanel },
];