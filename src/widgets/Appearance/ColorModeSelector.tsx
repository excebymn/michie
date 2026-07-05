import React from 'react';
import { useAppearanceStore, ColorMode } from '../../stores/appearanceStore';

const MODES: { id: ColorMode; label: string }[] = [
  { id: 'system', label: 'Follow System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export const ColorModeSelector: React.FC = () => {
  const colorMode = useAppearanceStore((s) => s.colorMode);
  const setColorMode = useAppearanceStore((s) => s.setColorMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Color Mode</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {MODES.map((mode) => {
          const isActive = mode.id === colorMode;
          return (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className="michie-box"
              style={{
                padding: '10px 16px',
                border: isActive ? '2px solid var(--michie-accent)' : 'none',
                color: 'var(--michie-on-surface)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};