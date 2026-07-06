import React from 'react';
import { useAppearanceStore, Motion } from '../../stores/appearanceStore';

const OPTIONS: { id: Motion; label: string }[] = [
  { id: 'disabled', label: 'Disabled' },
  { id: 'normal', label: 'Normal' },
  { id: 'smooth', label: 'Smooth' },
];

export const MotionSelector: React.FC = () => {
  const motion = useAppearanceStore((s) => s.motion);
  const setMotion = useAppearanceStore((s) => s.setMotion);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Motion</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {OPTIONS.map((opt) => {
          const isActive = opt.id === motion;
          return (
            <button
              key={opt.id}
              onClick={() => setMotion(opt.id)}
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