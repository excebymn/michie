import { useModeStore, type AppMode } from "../../stores/modeStore";
import { playerService } from "../../services";

const MODE_OPTIONS: { id: AppMode; label: string; desc: string }[] = [
  {
    id: "normal",
    label: "Normal",
    desc: "Standard view with all widgets and panels.",
  },
  {
    id: "work",
    label: "Work Mode",
    desc: "Focus on what matters. Hides decorative widgets and the widget tray, keeping only the essentials.",
  },
  // {
  //   id: "video",
  //   label: "Video Player",
  //   desc: "Play videos from your library in fullscreen mode.",
  // },
];

export function ModePanel() {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);

  const handleSelect = async (next: AppMode) => {
    if (next === mode) return;
    if (next === "video") {
      // Musik dipause dulu sebelum masuk Video Mode — state queue-nya tetap
      // aman kesimpen di Rust in-memory, tinggal lanjut manual pas balik
      // ke Normal Mode lagi.
      await playerService.pause();
    }
    setMode(next);
  };

  return (
    <div className="mp-root">
      <h2 className="mp-title michie-text-secondary">Mode</h2>
      <p className="mp-desc michie-text-secondary">
        Choose how Michie is displayed.
      </p>

      <div className="mp-options" role="radiogroup">
        {MODE_OPTIONS.map((opt) => {
          const isActive = mode === opt.id;
          return (
            <button
              key={opt.id}
              className={
                "mp-option michie-box michie-box--primary michie-text-secondary" +
                (isActive ? " mp-option--active" : "")
              }
              onClick={() => handleSelect(opt.id)}
              role="radio"
              aria-checked={isActive}
            >
              <span className="mp-option-label">{opt.label}</span>
              <span className="mp-option-desc">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .mp-root { display: flex; flex-direction: column; gap: 20px; }
        .mp-title { margin: 0; font-size: 2.2rem; font-weight: 600; }
        .mp-desc { margin: 0; font-size: 1rem; line-height: 1.6; max-width: 480px; opacity: 0.85; }
        .mp-options { display: flex; flex-direction: column; gap: 10px; max-width: 420px; }
        .mp-option {
          border: none;
          padding: 14px 16px;
          border-radius: 16px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0.6;
          transition: opacity 0.15s ease, box-shadow 0.15s ease;
        }
        .mp-option--active {
          opacity: 1;
          box-shadow: inset 0 0 0 2px var(--color-secondary);
        }
        .mp-option-label { font-size: 1rem; font-weight: 600; }
        .mp-option-desc { font-size: 0.85rem; opacity: 0.8; line-height: 1.4; }
      `}</style>
    </div>
  );
}