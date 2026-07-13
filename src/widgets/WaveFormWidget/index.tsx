import { useEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useSpectralStore } from "../../stores/spectralStore";
import { spectralService } from "../../services/spectralService";

export function WaveformWidget() {
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

  const waveform = useMemo(() => spectralService.parseWaveform(result), [result]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform) return;
    const { cols, min, max, rms } = waveform;
    const width = canvas.clientWidth || cols;
    const height = 100;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const mid = height / 2;
    const colWidth = width / cols;

    // Envelope min/max -- bar tipis per kolom, gambaran umum bentuk gelombang.
    ctx.fillStyle = "rgba(150,150,150,0.5)";
    for (let i = 0; i < cols; i++) {
      const x = i * colWidth;
      const yTop = mid - max[i] * mid;
      const yBottom = mid - min[i] * mid;
      ctx.fillRect(x, yTop, Math.max(1, colWidth), Math.max(1, yBottom - yTop));
    }

    // Overlay RMS (loudness) -- garis lebih pekat di atas envelope, nunjukin
    // seberapa "penuh" dinamika lagu (loudness-war = garis ini nempel rapat
    // ke tepi envelope terus-menerus, bukan naik-turun).
    ctx.strokeStyle = "var(--color-primary)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < cols; i++) {
      const x = i * colWidth + colWidth / 2;
      const y = mid - rms[i] * mid;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [waveform]);

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
          Waveform &amp; Loudness
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
          {scanning ? "Analyzing..." : waveform ? "Rescan" : "Scan"}
        </button>
      </div>

      {error && <p style={{ color: "#e05555", margin: 0, fontSize: 13 }}>{error}</p>}

      {!waveform && !scanning && !error && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          No data yet. Press "Scan" to calculate the waveform and volume levels throughout the song.
        </p>
      )}

      {waveform && (
        <canvas ref={canvasRef} style={{ width: "100%", height: 100, borderRadius: 4, display: "block" }} />
      )}
    </div>
  );
}

export default WaveformWidget;