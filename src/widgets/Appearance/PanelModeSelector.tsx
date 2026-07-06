import React from 'react';
import { useAppearanceStore } from '../../stores/appearanceStore';
import type { PanelMode } from '../../appearance/types';

const OPTIONS: { id: PanelMode; label: string }[] = [
  { id: 'glass-solid', label: 'Glass + Solid' },
  { id: 'solid', label: 'Solid' },
  { id: 'glass', label: 'Glass' },
];

export const PanelModeSelector: React.FC = () => {
  const panelMode = useAppearanceStore((s) => s.panelMode);
  const setPanelMode = useAppearanceStore((s) => s.setPanelMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Gaya Panel</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {OPTIONS.map((opt) => {
          const isActive = opt.id === panelMode;
          return (
            <button
              key={opt.id}
              onClick={() => setPanelMode(opt.id)}
              className="glass solid panel"
              style={{
                padding: '10px 16px',
                border: isActive ? '2px solid var(--michie-secondary)' : undefined,
                color: 'var(--michie-on-surface)',
                cursor: 'pointer',
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