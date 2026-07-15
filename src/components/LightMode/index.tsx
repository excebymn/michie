import { useLightModeStore } from "../../stores/lightmodestore";

export function LightModePanel() {
  const isLightMode = useLightModeStore((s) => s.isLightMode);
  const toggleLightMode = useLightModeStore((s) => s.toggleLightMode);

  return (
    <div className="lmp-root">
      <h2 className="lmp-title">Work mode</h2>
      <p className="lmp-desc michie-text-secondary">
        Focus on what matters. Work Mode hides decorative widgets and keeps only the essentials on screen. It's perfect for studying, working, gaming, or reducing unnecessary resource usage.
      </p>

      <button
        className={
          "lmp-toggle michie-box " +
          (isLightMode ? "michie-box--primary" : "michie-box--secondary")
        }
        onClick={toggleLightMode}
        role="switch"
        aria-checked={isLightMode}
      >
        <span className="lmp-toggle-track">
          <span
            className={
              "lmp-toggle-knob michie-circle " +
              (isLightMode
                ? "michie-circle--secondary"
                : "michie-circle--primary")
            }
          />
        </span>
        <span className="lmp-toggle-label michie-text-secondary">
          {isLightMode ? "On" : "Off"}
        </span>
      </button>

      <style>{`
        .lmp-root { display: flex; flex-direction: column; gap: 20px; }
        .lmp-title { margin: 0; font-size: 2.2rem; font-weight: 600; }
        .lmp-desc { margin: 0; font-size: 1rem; line-height: 1.6; max-width: 480px; opacity: 0.85; }
        .lmp-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          padding: 10px 16px;
          border-radius: 999px;
          cursor: pointer;
          width: fit-content;
        }
        .lmp-toggle-track {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .lmp-toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          transition: transform 0.2s ease;
        }
        .lmp-toggle[aria-checked="true"] .lmp-toggle-knob {
          transform: translateX(20px);
        }
        .lmp-toggle-label { font-size: 0.9rem; font-weight: 500; }
      `}</style>
    </div>
  );
}