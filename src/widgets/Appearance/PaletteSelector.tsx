import React from 'react';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { palettes } from '../../appearance/palettes';

export const PaletteSelector: React.FC = () => {
  const paletteId = useAppearanceStore((s) => s.paletteId);
  const setPalette = useAppearanceStore((s) => s.setPalette);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Palet Warna</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {palettes.map((palette) => {
          const isActive = palette.id === paletteId;
          return (
            <button
              key={palette.id}
              onClick={() => setPalette(palette.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  outline: isActive ? '2px solid var(--michie-on-surface)' : '2px solid transparent',
                  outlineOffset: 3,
                }}
              >
                <div style={{ width: '50%', height: '100%', background: palette.primary }} />
                <div style={{ width: '50%', height: '100%', background: palette.secondary }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--michie-on-surface)', opacity: isActive ? 1 : 0.7 }}>
                {palette.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};