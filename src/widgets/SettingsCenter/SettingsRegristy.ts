import React from 'react';
import { SourcePicker } from '../SourcePicker';
import { LibraryView } from '../Library';
import { AppearancePanel } from '../Appearance';


export interface SettingsPanelConfig {
  id: string;
  label: string;
  component: React.FC;
}

export const settingsRegistry: SettingsPanelConfig[] = [
  { id: 'source', label: 'Sumber Direktori', component: SourcePicker },
  { id: 'library', label: 'Perpustakaan Musik', component: LibraryView },
  { id: 'appearance', label: 'Tampilan', component: AppearancePanel },
];