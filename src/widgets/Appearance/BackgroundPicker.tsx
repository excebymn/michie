import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppearanceStore } from '../../stores/appearanceStore';

export const BackgroundPicker: React.FC = () => {
  const backgroundMode = useAppearanceStore((s) => s.backgroundMode);
  const backgroundColor = useAppearanceStore((s) => s.backgroundColor);
  const setBackgroundColor = useAppearanceStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useAppearanceStore((s) => s.setBackgroundImage);
  const clearBackgroundImage = useAppearanceStore((s) => s.clearBackgroundImage);

  const handlePickImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Gambar', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (selected && !Array.isArray(selected)) {
      setBackgroundImage(selected);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Background</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          style={{ width: 44, height: 44, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'transparent' }}
        />

        <button
          onClick={handlePickImage}
          className="michie-box"
          style={{ padding: '10px 16px', border: 'none', color: 'var(--michie-on-surface)', cursor: 'pointer' }}
        >
          Pilih Gambar
        </button>

        {backgroundMode === 'image' && (
          <button
            onClick={clearBackgroundImage}
            className="michie-box"
            style={{ padding: '10px 16px', border: 'none', color: 'var(--michie-on-surface)', cursor: 'pointer', opacity: 0.7 }}
          >
            Hapus Gambar
          </button>
        )}
      </div>
    </div>
  );
};