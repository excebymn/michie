import { useShallow } from 'zustand/react/shallow';
import { open } from '@tauri-apps/plugin-dialog';
import { themeRegistry } from '../../config/themeRegistry';
import { paletteRegistry } from '../../config/paletteRegistry';
import { useAppearanceStore } from '../../stores/appearanceStore';
import './appearance.css';

export function AppearancePanel() {
  const {
    themeId,
    paletteId,
    backgroundType,
    backgroundValue,
    setTheme,
    setPalette,
    setBackgroundColor,
    setBackgroundImage,
  } = useAppearanceStore(
    useShallow((s) => ({
      themeId: s.themeId,
      paletteId: s.paletteId,
      backgroundType: s.backgroundType,
      backgroundValue: s.backgroundValue,
      setTheme: s.setTheme,
      setPalette: s.setPalette,
      setBackgroundColor: s.setBackgroundColor,
      setBackgroundImage: s.setBackgroundImage,
    }))
  );

  const handlePickImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (typeof selected === 'string') {
      setBackgroundImage(selected);
    }
  };

  return (
    <div className="appearance-panel">
      {/* THEME */}
      <section className="appearance-section">
        <h3 className="appearance-section-title michie-text-primary">Tema</h3>
        <div className="appearance-theme-grid">
          {themeRegistry.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`appearance-theme-card michie-box michie-box--secondary ${
                themeId === theme.id ? 'appearance-theme-card--active' : ''
              }`}
              onClick={() => setTheme(theme.id)}
            >
              <span className="michie-text-primary">{theme.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* PALETTE */}
      <section className="appearance-section">
        <h3 className="appearance-section-title michie-text-primary">Palet Warna</h3>
        <div className="appearance-palette-grid">
          {paletteRegistry.map((palette) => (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              className={`appearance-palette-swatch ${
                paletteId === palette.id ? 'appearance-palette-swatch--active' : ''
              }`}
              onClick={() => setPalette(palette.id)}
            >
              <span className="appearance-palette-half" style={{ backgroundColor: palette.primary }} />
              <span className="appearance-palette-half" style={{ backgroundColor: palette.secondary }} />
            </button>
          ))}
        </div>
      </section>

      {/* BACKGROUND */}
      <section className="appearance-section">
        <h3 className="appearance-section-title michie-text-primary">Background</h3>
        <div className="appearance-background-controls">
          <label className="appearance-bg-option">
            <input
              type="radio"
              name="bg-type"
              checked={backgroundType === 'color'}
              onChange={() => setBackgroundColor(backgroundType === 'color' ? backgroundValue : '#101010')}
            />
            <span className="michie-text-secondary">Warna</span>
            <input
              type="color"
              className="appearance-color-input"
              value={backgroundType === 'color' ? backgroundValue : '#101010'}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>

          <label className="appearance-bg-option">
            <input type="radio" name="bg-type" checked={backgroundType === 'image'} onChange={handlePickImage} />
            <span className="michie-text-secondary">Gambar</span>
            <button
              type="button"
              className="appearance-bg-pick-btn michie-box michie-box--secondary"
              onClick={handlePickImage}
            >
              <span className="michie-text-primary">Pilih Gambar</span>
            </button>
          </label>

          {backgroundType === 'image' && (
            <span className="appearance-bg-current-path michie-text-secondary" title={backgroundValue}>
              {backgroundValue}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}