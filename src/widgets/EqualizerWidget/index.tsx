import { useEffect } from "react";
import { useEqualizerStore } from "../../stores/equalizerStore";
import "./equalizer.css";

const MIN_GAIN = -12;
const MAX_GAIN = 12;
const GAIN_STEP = 0.5;

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
}

export default function Equalizer() {
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
    return <div className="equalizer equalizer--loading" />;
  }

  return (
    <div className={`equalizer${!enabled ? " equalizer--bypassed" : ""}`}>
      <div className="equalizer__bands">
        {bands.map((band, i) => (
          <div key={i} className="equalizer__band">
            {/* Angka dB menggunakan teks secondary */}
            <span className="equalizer__gain-label michie-text-secondary">
              {band.gain_db > 0 ? "+" : ""}
              {band.gain_db.toFixed(1)}
            </span>

            <div className="equalizer__slider-track">
              {/* Garis nol mengikuti warna border/teks secondary */}
              <div className="equalizer__zero-line michie-bg-secondary" />
              
              {/* INPUT SLIDER: 
                  - .michie-box--secondary memberikan warna dasar rel via `inherit`
                  - .michie-text-primary memberikan warna bulatan via `currentColor` */}
              <input
                type="range"
                className="equalizer__slider michie-box--secondary michie-text-secondary"
                min={MIN_GAIN}
                max={MAX_GAIN}
                step={GAIN_STEP}
                value={band.gain_db}
                disabled={!enabled}
                onChange={(e) => setBandGain(i, parseFloat(e.target.value))}
              />
            </div>

            {/* Label frekuensi menggunakan teks secondary */}
            <span className="equalizer__freq-label michie-text-secondary michie-box-">
              {formatFreq(band.frequency)}
            </span>
          </div>
        ))}
      </div>

      <div className="equalizer__controls">
        <button
          type="button"
          className={
            enabled
              ? "michie-box--primary michie-text-secondary equalizer__toggle"
              : "michie-box--secondary michie-text-primary equalizer__toggle"
          }
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="michie-box--secondary michie-text-primary equalizer__reset"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}