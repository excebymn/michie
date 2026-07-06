import React from 'react';
import { ThemeSelector } from './ThemeSelector';
import { ColorModeSelector } from './ColorModeSelector';
import { MotionSelector } from './MotionSelector';
import { TransparencySelector } from './TransparencySelector';

export const Appearance: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 600 }}>Tampilan</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>
          Atur gaya visual, mode warna, animasi, dan transparansi aplikasi Michie.
        </p>
      </div>

      <ThemeSelector />
      <ColorModeSelector />
      <MotionSelector />
      <TransparencySelector />
    </div>
  );
};