import { useEffect } from "react";
import { useEqualizerStore } from "../../stores/equalizerStore";
import "./equalizer-horizontal.css";

const MIN_GAIN = -12;
const MAX_GAIN = 12;
const GAIN_STEP = 0.5;

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
}

export default function EqualizerHorizontal() {
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

  if (!loaded) {
    return <div className="equalizer-horizontal equalizer-horizontal--loading" />;
  }

  return (
    <div className={`equalizer-horizontal${!enabled ? " equalizer-horizontal--bypassed" : ""}`}>
      <div className="equalizer-horizontal__rows">
        {bands.map((band, i) => (
          <div className="equalizer-horizontal__row" key={i}>
            <span className="equalizer-horizontal__freq-label michie-text-secondary">
              {formatFreq(band.frequency)}
            </span>
            <input
              type="range"
              className="michie-box--secondary equalizer-horizontal__slider "
              min={MIN_GAIN}
              max={MAX_GAIN}
              step={GAIN_STEP}
              value={band.gain_db}
              disabled={!enabled}
              onChange={(e) => setBandGain(i, parseFloat(e.target.value))}
            />
            <span className="equalizer-horizontal__gain-label michie-text-secondary">
              {band.gain_db > 0 ? "+" : ""}
              {band.gain_db.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div className="equalizer-horizontal__controls">
        <button
          type="button"
          className={
            enabled
              ? "michie-box--primary equalizer-horizontal__toggle michie-text-secondary"
              : "michie-box--secondary equalizer-horizontal__toggle michie-text-primary"
          }
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="michie-box--secondary equalizer-horizontal__reset michie-text-primary"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}