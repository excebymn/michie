import { useShallow } from "zustand/react/shallow";
import { open } from "@tauri-apps/plugin-dialog";
import { themeRegistry } from "../../config/themeRegistry";
import { paletteRegistry } from "../../config/paletteRegistry";
import { useAppearanceStore } from "../../stores/appearanceStore";
import "./appearance.css";

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
    })),
  );

  const handlePickImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (typeof selected === "string") {
      setBackgroundImage(selected);
    }
  };

  const sectionTitleClass =
    "michie-text-primary text-[11px] font-semibold uppercase tracking-[0.12em]";

  return (
    <div className="appearance-panel flex flex-col gap-7 p-5">
      {/* THEME */}
      <section className="appearance-section flex flex-col gap-3">
        <h2 className=" michie-text-secondary {`appearance-section-title ${sectionTitleClass}`}">
          Theme
        </h2>
        <p className=" michie-text-secondary">
          you can arrange everything in michie, find your best combination
        </p>
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
        <h3 className={`appearance-section-title ${sectionTitleClass}`}>
          color palette
        </h3>
        <div className="appearance-palette-grid flex flex-wrap gap-2.5">
          {paletteRegistry.map((palette) => {
            const isActive = paletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                title={palette.label}
                className={[
                  "appearance-palette-swatch",
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
      </section>

      {/* BACKGROUND */}
      <section className="appearance-section flex flex-col gap-3">
        <div className="michie-box michie-box--secondary">
          <h3 className={`appearance-section-title  ${sectionTitleClass}`}>
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
            <span className="michie-text-secondary text-sm">color</span>
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
              checked={backgroundType === "image"}
              onChange={handlePickImage}
            />
            <span className="michie-text-secondary text-sm">Image</span>
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
              <span className="michie-text-primary">Choose image</span>
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
