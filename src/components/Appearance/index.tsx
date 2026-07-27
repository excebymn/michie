import { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { open } from "@tauri-apps/plugin-dialog";
import { themeRegistry } from "../../config/themeRegistry";
import { paletteRegistry } from "../../config/paletteRegistry";
import { useAppearanceStore } from "../../stores/appearanceStore";
import { saveBackgroundImage } from "../../services/appearanceService";
import "./appearance.css";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Normalisasi input user: terima dengan/tanpa '#', trim spasi.
// Return null kalau bukan hex 3 atau 6 digit yang valid.
function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return HEX_RE.test(withHash) ? withHash : null;
}

export function AppearancePanel() {
  const {
    themeId,
    paletteId,
    customPrimary,
    customSecondary,
    backgroundType,
    backgroundValue,
    setTheme,
    setPalette,
    setAlbumTonePalette,
    setCustomPalette,
    setBackgroundColor,
    setBackgroundImage,
    setBackgroundPaletteRef,
  } = useAppearanceStore(
    useShallow((s) => ({
      themeId: s.themeId,
      paletteId: s.paletteId,
      customPrimary: s.customPrimary,
      customSecondary: s.customSecondary,
      backgroundType: s.backgroundType,
      backgroundValue: s.backgroundValue,
      setTheme: s.setTheme,
      setPalette: s.setPalette,
      setAlbumTonePalette: s.setAlbumTonePalette,
      setCustomPalette: s.setCustomPalette,
      setBackgroundColor: s.setBackgroundColor,
      setBackgroundImage: s.setBackgroundImage,
      setBackgroundPaletteRef: s.setBackgroundPaletteRef,
    })),
  );

  // Draft lokal untuk text field hex, supaya user bisa ngetik bebas
  // (termasuk state sementara yang belum valid) tanpa langsung nge-apply
  // tiap keystroke. Disinkronkan ulang tiap store berubah dari luar
  // (misal restore/hydrate, atau ganti ke palette lain terus balik lagi).
  const [primaryDraft, setPrimaryDraft] = useState(customPrimary);
  const [secondaryDraft, setSecondaryDraft] = useState(customSecondary);
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);

  useEffect(() => {
    setPrimaryDraft(customPrimary);
    setPrimaryError(false);
  }, [customPrimary]);

  useEffect(() => {
    setSecondaryDraft(customSecondary);
    setSecondaryError(false);
  }, [customSecondary]);

  const commitPrimary = (raw: string) => {
    const normalized = normalizeHex(raw);
    if (!normalized) {
      setPrimaryError(true);
      return;
    }
    setPrimaryError(false);
    setCustomPalette(normalized, customSecondary);
  };

  const commitSecondary = (raw: string) => {
    const normalized = normalizeHex(raw);
    if (!normalized) {
      setSecondaryError(true);
      return;
    }
    setSecondaryError(false);
    setCustomPalette(customPrimary, normalized);
  };

  const handlePickImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (typeof selected === "string") {
      const savedPath = await saveBackgroundImage(selected);
      setBackgroundImage(savedPath);
    }
  };

  const sectionTitleClass =
    "michie-text-primary text-[11px] font-semibold uppercase tracking-[0.12em]";

  return (
    <div className="appearance-panel flex flex-col gap-7 p-5">
      {/* THEME */}
      <section className="appearance-section flex flex-col gap-3">
        <h2 className="michie-text-secondary appearance-section-title">
          You can arrange everything in michie, find your best combination
        </h2>
        <p className="michie-text-secondary">Themes</p>
        <div className="appearance-theme-grid grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {themeRegistry.map((theme) => {
            const isActive = themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={[
                  "appearance-theme-card michie-box michie-box--secondary",
                  "flex h-11 items-center justify-center rounded-md px-3",
                  "text-sm transition duration-150 ease-out",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive ? "appearance-theme-card--active" : "",
                ].join(" ")}
                onClick={() => setTheme(theme.id)}
              >
                <span className="michie-text-primary truncate">
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* PALETTE */}
      <section className="appearance-section flex flex-col gap-3">
        <p className={`michie-box michie-box--secondary michie-text-primary ${sectionTitleClass}`}>
          color palette
        </p>

        <div className="appearance-palette-groups flex flex-col gap-5">
          {/* Dynamic: mengikuti album art lagu yang sedang diputar */}
          <div className="appearance-palette-group flex flex-col gap-2">
            <p className="appearance-palette-group-label michie-text-secondary">
              Dynamic
            </p>
            <div className="appearance-palette-grid flex flex-wrap gap-2.5">
              <button
                type="button"
                title="follow the album art of the song currently playing."
                className={[
                  "appearance-palette-swatch appearance-palette-swatch--tone",
                  "relative h-10 w-10 shrink-0 overflow-hidden rounded-full",
                  "transition duration-150 ease-out",
                  "hover:scale-110 active:scale-95",
                  paletteId === "album-tone"
                    ? "appearance-palette-swatch--active"
                    : "",
                ].join(" ")}
                onClick={setAlbumTonePalette}
              >
                <span className="appearance-palette-tone-icon michie-text-secondary">@</span>
              </button>
            </div>
            <p className="michie-text-secondary appearance-palette-group-hint">
              Colors are pulled automatically from the currently playing song's album art.
            </p>
          </div>

          {/* Custom: 2 warna hex yang diinput sendiri oleh user */}
          <div className="appearance-palette-group flex flex-col gap-2">
            <p className="appearance-palette-group-label michie-text-secondary">
              Custom
            </p>
            <div className="appearance-palette-grid flex flex-wrap gap-2.5">
              <button
                type="button"
                title="input your own custom colors"
                className={[
                  "appearance-palette-swatch appearance-palette-swatch--custom michie-circle",
                  "relative h-10 w-10 shrink-0 overflow-hidden rounded-full",
                  "transition duration-150 ease-out",
                  "hover:scale-110 active:scale-95",
                  paletteId === "custom" ? "appearance-palette-swatch--active" : "",
                ].join(" ")}
                onClick={() => setCustomPalette(customPrimary, customSecondary)}
              >
                <span
                  className="appearance-palette-half absolute inset-y-0 left-0 w-1/2"
                  style={{ backgroundColor: customPrimary }}
                />
                <span
                  className="appearance-palette-half absolute inset-y-0 right-0 w-1/2"
                  style={{ backgroundColor: customSecondary }}
                />
                <span className="appearance-palette-custom-icon">+</span>
              </button>
            </div>
            <p className="michie-text-secondary appearance-palette-group-hint">
              Pick your own two colors below — type a hex code or use the color picker.
            </p>
            {paletteId === "custom" && (
              <div className="appearance-custom-palette-inputs flex flex-col gap-2.5">
                <div className="appearance-custom-hex-row flex items-center gap-3">
                  <input
                    type="color"
                    className="appearance-color-input h-8 w-12 shrink-0 cursor-pointer rounded-md"
                    value={/^#[0-9a-fA-F]{6}$/.test(customPrimary) ? customPrimary : "#000000"}
                    onChange={(e) => commitPrimary(e.target.value)}
                  />
                  <input
                    type="text"
                    spellCheck={false}
                    placeholder="#primary"
                    className={[
                      "appearance-hex-text-input michie-box michie-box--secondary",
                      "michie-text-primary rounded-md px-2.5 py-1.5 text-sm",
                      primaryError ? "appearance-hex-text-input--error" : "",
                    ].join(" ")}
                    value={primaryDraft}
                    onChange={(e) => setPrimaryDraft(e.target.value)}
                    onBlur={(e) => commitPrimary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitPrimary((e.target as HTMLInputElement).value);
                    }}
                  />
                  <span className="michie-text-secondary text-sm">primary</span>
                </div>
                <div className="appearance-custom-hex-row flex items-center gap-3">
                  <input
                    type="color"
                    className="appearance-color-input h-8 w-12 shrink-0 cursor-pointer rounded-md"
                    value={/^#[0-9a-fA-F]{6}$/.test(customSecondary) ? customSecondary : "#000000"}
                    onChange={(e) => commitSecondary(e.target.value)}
                  />
                  <input
                    type="text"
                    spellCheck={false}
                    placeholder="#secondary"
                    className={[
                      "appearance-hex-text-input michie-box michie-box--secondary",
                      "michie-text-primary rounded-md px-2.5 py-1.5 text-sm",
                      secondaryError ? "appearance-hex-text-input--error" : "",
                    ].join(" ")}
                    value={secondaryDraft}
                    onChange={(e) => setSecondaryDraft(e.target.value)}
                    onBlur={(e) => commitSecondary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitSecondary((e.target as HTMLInputElement).value);
                    }}
                  />
                  <span className="michie-text-secondary text-sm">secondary</span>
                </div>
                {(primaryError || secondaryError) && (
                  <p className="appearance-hex-error-hint">
                    Invalid hex — use a format like #1a2b3c or #abc.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Presets: kombinasi tetap dari paletteRegistry */}
          <div className="appearance-palette-group flex flex-col gap-2">
            <p className="appearance-palette-group-label michie-text-secondary">
              Presets
            </p>
            <div className="appearance-palette-grid flex flex-wrap gap-2.5">
              {paletteRegistry.map((palette) => {
                const isActive = paletteId === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    title={palette.label}
                    className={[
                      "appearance-palette-swatch michie-circle",
                      "relative h-10 w-10 shrink-0 overflow-hidden rounded-full",
                      "transition duration-150 ease-out",
                      "hover:scale-110 active:scale-95",
                      isActive ? "appearance-palette-swatch--active" : "",
                    ].join(" ")}
                    onClick={() => setPalette(palette.id)}
                  >
                    <span
                      className="appearance-palette-half absolute inset-y-0 left-0 w-1/2"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span
                      className="appearance-palette-half absolute inset-y-0 right-0 w-1/2"
                      style={{ backgroundColor: palette.secondary }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="michie-text-secondary appearance-palette-group-hint">
              Ready-made color combinations.
            </p>
          </div>
        </div>
      </section>

      {/* BACKGROUND */}
      <section className="appearance-section flex flex-col gap-3">
        <div className="michie-box michie-box--secondary">
          <h3 className={`appearance-section-title ${sectionTitleClass}`}>
            Custom app background
          </h3>
        </div>
        <div className="appearance-background-controls flex flex-col gap-3">
          <label className="appearance-bg-option flex items-center gap-3">
            <input
              type="radio"
              name="bg-type"
              className="appearance-radio h-4 w-4 shrink-0"
              checked={backgroundType === "color"}
              onChange={() =>
                setBackgroundColor(
                  backgroundType === "color" ? backgroundValue : "#101010",
                )
              }
            />
            <span className="michie-text-secondary text-sm">custom colors</span>
            <input
              type="color"
              className="appearance-color-input h-8 w-12 shrink-0 cursor-pointer rounded-md"
              value={backgroundType === "color" ? backgroundValue : "#101010"}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>

          <label className="appearance-bg-option flex items-center gap-3">
            <input
              type="radio"
              name="bg-type"
              className="appearance-radio h-4 w-4 shrink-0"
              checked={backgroundType === "primary"}
              onChange={() => setBackgroundPaletteRef("primary")}
            />
            <span className="michie-text-secondary text-sm">
              follow primary color palette
            </span>
          </label>

          <label className="appearance-bg-option flex items-center gap-3">
            <input
              type="radio"
              name="bg-type"
              className="appearance-radio h-4 w-4 shrink-0"
              checked={backgroundType === "secondary"}
              onChange={() => setBackgroundPaletteRef("secondary")}
            />
            <span className="michie-text-secondary text-sm">
              follow secondary color palette
            </span>
          </label>

          <label className="appearance-bg-option flex items-center gap-3">
            <input
              type="radio"
              name="bg-type"
              className="appearance-radio h-4 w-4 shrink-0"
              checked={backgroundType === "image"}
              onChange={handlePickImage}
            />
            <span className="michie-text-secondary text-sm">custom images</span>
            <button
              type="button"
              className={[
                "appearance-bg-pick-btn michie-box michie-box--secondary",
                "rounded-md px-3 py-1.5 text-sm",
                "transition duration-150 ease-out",
                "hover:scale-[1.02] active:scale-[0.98]",
              ].join(" ")}
              onClick={handlePickImage}
            >
              <span className="michie-text-primary">choose image</span>
            </button>
          </label>

          {backgroundType === "image" && (
            <span
              className="appearance-bg-current-path michie-text-secondary truncate rounded-md px-2.5 py-1 text-xs"
              title={backgroundValue}
            >
              {backgroundValue}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}