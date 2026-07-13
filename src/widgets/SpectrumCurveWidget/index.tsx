import { useEffect, useMemo } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useSpectralStore } from "../../stores/spectralStore";
import { spectralService } from "../../services/spectralService";

const WIDTH = 320;
const HEIGHT = 140;
const MIN_DB = -90;
const MAX_DB = 0;

export function SpectrumCurveWidget() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const songPath = currentSong?.path ?? null;

  const result = useSpectralStore((s) => (songPath ? s.results[songPath] : undefined));
  const scanning = useSpectralStore((s) => (songPath ? !!s.scanning[songPath] : false));
  const error = useSpectralStore((s) => (songPath ? s.errors[songPath] : undefined));
  const ensureChecked = useSpectralStore((s) => s.ensureChecked);
  const scan = useSpectralStore((s) => s.scan);

  useEffect(() => {
    if (songPath) ensureChecked(songPath);
  }, [songPath, ensureChecked]);

  const curve = useMemo(() => spectralService.parseSpectrumCurve(result), [result]);

  const pathD = useMemo(() => {
    if (!curve || curve.points.length === 0) return "";
    const n = curve.points.length;
    return curve.points
      .map((p, i) => {
        const x = (i / (n - 1)) * WIDTH;
        const norm = (p.db - MIN_DB) / (MAX_DB - MIN_DB);
        const y = HEIGHT - Math.max(0, Math.min(1, norm)) * HEIGHT;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [curve]);

  if (!songPath) {
    return (
      <div className="michie-box" style={{ padding: 16 }}>
        <p className="michie-text-secondary" style={{ margin: 0 }}>
          No song is currently playing.

        </p>
      </div>
    );
  }

  return (
    <div
      className="michie-box"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="michie-text-secondary" style={{ margin: 0, fontSize: 15 }}>
          Spectrum Curve
        </h3>


        <button
          onClick={() => scan(songPath)}
          disabled={scanning}
          className="michie-box michie-box--secondary michie-text-primary"
          style={{
            padding: "6px 14px",
            border: "none",
            cursor: scanning ? "default" : "pointer",
            fontSize: 13,
            opacity: scanning ? 0.7 : 1,
          }}
        >
          {scanning ? "Analyzing..." : curve ? "Rescan" : "Scan"}

        </button>
      </div>

      {error && <p style={{ color: "#e05555", margin: 0, fontSize: 13 }}>{error}</p>}

      {!curve && !scanning && !error && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          No data available. Press "Scan" to compute this song's average spectrum curve.

        </p>
      )}

      {curve && (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "auto" }}>
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      )}

      {curve && (
        <div className="michie-text-secondary" style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span>{MIN_DB} dB</span>
          <span>{MAX_DB} dB (relative to peak)</span>

        </div>
      )}
    </div>
  );
}

export default SpectrumCurveWidget;