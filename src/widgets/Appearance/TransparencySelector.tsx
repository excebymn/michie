import React from 'react';
import { useAppearanceStore, Transparency } from '../../stores/appearanceStore';

const OPTIONS: { id: Transparency; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const TransparencySelector: React.FC = () => {
  const transparency = useAppearanceStore((s) => s.transparency);
  const setTransparency = useAppearanceStore((s) => s.setTransparency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Transparency</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {OPTIONS.map((opt) => {
          const isActive = opt.id === transparency;
          return (
            <button
              key={opt.id}
              onClick={() => setTransparency(opt.id)}
              className="michie-box"
              style={{
                padding: '10px 16px',
                border: isActive ? '2px solid var(--michie-accent)' : 'none',
                color: 'var(--michie-on-surface)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};