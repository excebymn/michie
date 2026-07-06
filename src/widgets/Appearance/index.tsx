import React from 'react';
import { BackgroundPicker } from './BackgroundPicker';
import { PaletteSelector } from './PaletteSelector';
import { PanelModeSelector } from './PanelModeSelector';

export const Appearance: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 600 }}>Tampilan</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>
          Atur background, palet warna, dan efek panel aplikasi Michie.
        </p>
      </div>

      <BackgroundPicker />
      <PaletteSelector />
      <PanelModeSelector />
    </div>
  );
};