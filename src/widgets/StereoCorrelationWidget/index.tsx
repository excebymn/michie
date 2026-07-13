import { useEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useSpectralStore } from "../../stores/spectralStore";
import { spectralService } from "../../services/spectralService";

export function StereoCorrelationWidget() {
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

  const stereo = useMemo(() => spectralService.parseStereoCorrelation(result), [result]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stereo || stereo.mono || !stereo.correlation) return;
    const cols = stereo.correlation.length;
    const width = canvas.clientWidth || cols;
    const height = 80;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const mid = height / 2;
    ctx.strokeStyle = "rgba(150,150,150,0.3)";
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();

    const colWidth = width / cols;
    for (let i = 0; i < cols; i++) {
      const value = stereo.correlation[i]; // -1..1
      const x = i * colWidth;
      const barHeight = Math.abs(value) * mid;
      const y = value >= 0 ? mid - barHeight : mid;
      // Hijau = in-phase/koheren (aman di-mono-kan), merah = out-of-phase
      // (berisiko "hilang" kalau di-mono-kan / diputar di speaker mono).
      ctx.fillStyle = value >= 0 ? "rgba(80,200,120,0.7)" : "rgba(220,80,80,0.7)";
      ctx.fillRect(x, y, Math.max(1, colWidth), Math.max(1, barHeight));
    }
  }, [stereo]);

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
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="michie-text-secondary" style={{ margin: 0, fontSize: 15 }}>
          Stereo Correlation
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
          {scanning ? "Analyzing..." : stereo ? "Rescan" : "Scan"}
        </button>
      </div>

      {error && <p style={{ color: "#e05555", margin: 0, fontSize: 13 }}>{error}</p>}

      {!stereo && !scanning && !error && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          No data yet. Press "Scan" to inspect how wide and coherent this song's stereo image is.
        </p>
      )}

      {stereo?.mono && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          This file is mono — there is no stereo information to display.
        </p>
      )}

      {stereo && !stereo.mono && stereo.correlation && (
        <>
          <canvas ref={canvasRef} style={{ width: "100%", height: 80, borderRadius: 4, display: "block" }} />
          <div className="michie-text-secondary" style={{ fontSize: 12 }}>
            Average correlation: {stereo.average_correlation?.toFixed(2)}
            {typeof stereo.average_correlation === "number" && stereo.average_correlation < 0.3 && (
              <> — wide stereo, or possible phase issues</>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StereoCorrelationWidget;