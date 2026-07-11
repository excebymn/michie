import { useEffect } from "react";
import { useEqualizerStore } from "../../stores/equalizerStore";
import "./equalizer-led.css";

const MIN_GAIN = -12;
const MAX_GAIN = 12;
const GAIN_STEP = 0.5;
// Bargraph simetris: 12 segmen di atas titik tengah (+1..+12dB),
// 12 di bawah (-1..-12dB). Cuma dekoratif — nilai asli tetap presisi 0.5dB
// lewat native input yang disembunyikan di atasnya.
const HALF_SEGMENTS = 12;

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
}

function getLedSegments(gain: number): boolean[] {
  const segments: boolean[] = [];
  for (let i = 0; i < HALF_SEGMENTS; i++) {
    const threshold = HALF_SEGMENTS - i; // 12 turun ke 1
    segments.push(gain >= threshold);
  }
  for (let j = 0; j < HALF_SEGMENTS; j++) {
    const threshold = -(j + 1); // -1 turun ke -12
    segments.push(gain <= threshold);
  }
  return segments;
}

export default function EqualizerLed() {
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
    return <div className="equalizer-led equalizer-led--loading" />;
  }

  return (
    <div className={`equalizer-led${!enabled ? " equalizer-led--bypassed" : ""}`}>
      <div className="equalizer-led__bands">
        {bands.map((band, i) => {
          const segments = getLedSegments(band.gain_db);
          return (
            <div className="equalizer-led__band" key={i}>
              <span className="equalizer-led__gain-label michie-text-secondary">
                {band.gain_db > 0 ? "+" : ""}
                {band.gain_db.toFixed(1)}
              </span>

              <div className="equalizer-led__track">
                <div className="equalizer-led__segments">
                  {segments.map((lit, s) => (
                    <div
                      key={s}
                      className={
                        lit
                          ? " michie-box michie-bg-secondary equalizer-led__segment equalizer-led__segment--lit"
                          : "equalizer-led__segment  michie-box michie-box--secondary"
                      }
                      style={s === HALF_SEGMENTS - 1 ? { marginBottom: 2 } : undefined}
                    />
                  ))}
                </div>
                <input
                  type="range"
                  className="equalizer-led__input"
                  min={MIN_GAIN}
                  max={MAX_GAIN}
                  step={GAIN_STEP}
                  value={band.gain_db}
                  disabled={!enabled}
                  onChange={(e) => setBandGain(i, parseFloat(e.target.value))}
                />
              </div>

              <span className="equalizer-led__freq-label michie-text-secondary">
                {formatFreq(band.frequency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="equalizer-led__controls">
        <button
          type="button"
          className={
            enabled
              ? "michie-box--primary equalizer-led__toggle michie-text-secondary"
              : "michie-box--secondary equalizer-led__toggle michie-text-primary"
          }
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="michie-box--secondary equalizer-led__reset michie-text-primary"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}