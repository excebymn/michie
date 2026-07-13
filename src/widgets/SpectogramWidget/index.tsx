import { useEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useSpectralStore } from "../../stores/spectralStore";
import { spectralService } from "../../services/spectralService";

// Colormap sederhana: gelap (hening) -> ungu -> biru -> hijau -> kuning ->
// putih (paling keras). Bukan colormap ilmiah presisi (viridis/dsb), cukup
// buat kebutuhan visual "lihat cutoff-nya di mana" ala Spek.
function colorFor(value: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [10, 10, 20],
    [55, 30, 110],
    [30, 130, 180],
    [80, 200, 120],
    [240, 230, 60],
    [255, 255, 255],
  ];
  const t = Math.max(0, Math.min(1, value / 255));
  const scaled = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const frac = scaled - i;
  const [r1, g1, b1] = stops[i];
  const [r2, g2, b2] = stops[i + 1];
  return [
    Math.round(r1 + (r2 - r1) * frac),
    Math.round(g1 + (g2 - g1) * frac),
    Math.round(b1 + (b2 - b1) * frac),
  ];
}

export function SpectrogramWidget() {
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

  const spectrogram = useMemo(() => spectralService.parseSpectrogram(result), [result]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogram) return;
    const { time_cols, freq_rows, data } = spectrogram;
    canvas.width = time_cols;
    canvas.height = freq_rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(time_cols, freq_rows);
    for (let col = 0; col < time_cols; col++) {
      for (let row = 0; row < freq_rows; row++) {
        const value = data[col * freq_rows + row];
        const [r, g, b] = colorFor(value);
        // data[]: index band 0 = frekuensi TERENDAH. Digambar flip vertikal
        // supaya frekuensi tinggi ada di ATAS kanvas (konvensi visual umum
        // buat spectrogram, sama seperti Spek/Adobe Audition).
        const flippedRow = freq_rows - 1 - row;
        const idx = (flippedRow * time_cols + col) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [spectrogram]);

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
          Spectrogram
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
          {scanning ? "Analyzing..." : spectrogram ? "Rescan" : "Scan"}

        </button>
      </div>

      {error && <p style={{ color: "#e05555", margin: 0, fontSize: 13 }}>{error}</p>}

      {!spectrogram && !scanning && !error && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          No data available. Press "Scan" to generate this song's spectrogram —
          best for visually seeing those fake-lossless high-frequency cutoffs.

        </p>
      )}

      {spectrogram && (
        <>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: 140, imageRendering: "pixelated", borderRadius: 4, display: "block" }}
          />
          <div className="michie-text-secondary" style={{ fontSize: 11 }}>
            Vertical: 0 Hz (bottom) – {(spectrogram.max_hz / 1000).toFixed(1)} kHz (top) · Horizontal: time
            (0 – {Math.round(spectrogram.duration_sec)}s)

          </div>
        </>
      )}
    </div>
  );
}

export default SpectrogramWidget;