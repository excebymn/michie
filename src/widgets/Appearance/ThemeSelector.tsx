import React from 'react';
import { useAppearanceStore } from '../../stores/appearanceStore';

const THEMES = [
  { id: 'liquid-glass', label: 'Liquid Glass' },
  { id: 'fluent', label: 'Windows Fluent' },
  { id: 'material-you', label: 'Material You' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'neon', label: 'Neon' },
];

export const ThemeSelector: React.FC = () => {
  const activeTheme = useAppearanceStore((s) => s.activeTheme);
  const setTheme = useAppearanceStore((s) => s.setTheme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Theme</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {THEMES.map((theme) => {
          const isActive = theme.id === activeTheme;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className="michie-box"
              style={{
                padding: '10px 16px',
                border: isActive ? '2px solid var(--michie-accent)' : 'none',
                color: 'var(--michie-on-surface)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {theme.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};