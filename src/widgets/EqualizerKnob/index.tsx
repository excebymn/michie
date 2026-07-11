import { useEffect } from "react";
import { useEqualizerStore } from "../../stores/equalizerStore";
import "./equalizer-knob.css";

const MIN_GAIN = -12;
const MAX_GAIN = 12;
const GAIN_STEP = 0.5;
const DRAG_SENSITIVITY = 0.15; // dB per pixel drag vertikal

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
}

export default function EqualizerKnob() {
  const bands = useEqualizerStore((s) => s.bands);
  const enabled = useEqualizerStore((s) => s.enabled);
  const loaded = useEqualizerStore((s) => s.loaded);
  const fetchInitial = useEqualizerStore((s) => s.fetchInitial);
  const setBandGain = useEqualizerStore((s) => s.setBandGain);
  const setEnabled = useEqualizerStore((s) => s.setEnabled);
  const reset = useEqualizerStore((s) => s.reset);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const startY = e.clientY;
    const startValue = useEqualizerStore.getState().bands[index].gain_db;

    // Window-level listener (bukan pointer capture di elemen) — pola yang
    // sama dipakai buat fix drag di progress slider webkit2gtk sebelumnya.
    const handleMove = (ev: PointerEvent) => {
      const deltaY = startY - ev.clientY; // geser ke atas = naik
      const raw = startValue + deltaY * DRAG_SENSITIVITY;
      const clamped = Math.max(MIN_GAIN, Math.min(MAX_GAIN, raw));
      const rounded = Math.round(clamped / GAIN_STEP) * GAIN_STEP;
      setBandGain(index, rounded);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  if (!loaded) {
    return <div className="equalizer-knob equalizer-knob--loading" />;
  }

  return (
    <div className={`equalizer-knob${!enabled ? " equalizer-knob--bypassed" : ""}`}>
      <div className="equalizer-knob__bands michie-text-secondary">
        {bands.map((band, i) => {
          const angle = (band.gain_db / MAX_GAIN) * 135;
          return (
            <div className="equalizer-knob__band" key={i}>
              <span className="equalizer-knob__gain-label">
                {band.gain_db > 0 ? "+" : ""}
                {band.gain_db.toFixed(1)}
              </span>
              <div
                className="equalizer-knob__knob"
                onPointerDown={startDrag(i)}
                onDoubleClick={() => setBandGain(i, 0)}
              >
                <div
                  className="michie-circle--secondary equalizer-knob__body"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div className="equalizer-knob__indicator  michie-box--primary" />
                </div>
              </div>
              <span className="equalizer-knob__freq-label michie-text-secondary">
                {formatFreq(band.frequency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="equalizer-knob__controls">
        <button
          type="button"
          className={
            enabled
              ? "michie-box--primary equalizer-knob__toggle"
              : "michie-box--secondary equalizer-knob__toggle"
          }
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="michie-box--secondary equalizer-knob__reset michie-text-primary"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}