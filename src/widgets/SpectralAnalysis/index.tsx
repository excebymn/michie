import { useEffect } from "react";
// ASUMSI: hook Zustand playerStore bernama `usePlayerStore` dan expose
// `currentSong` (sesuai deskripsi playerStore.ts di context doc). Sesuaikan
// import & nama field ini kalau ternyata beda di project kamu.
import { usePlayerStore } from "../../stores/playerStore";
import { useSpectralStore } from "../../stores/spectralStore";

function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
  return `${Math.round(hz)} Hz`;
}

interface MetricProps {
  label: string;
  value: string;
  warn?: boolean;
}

function Metric({ label, value, warn }: MetricProps) {
  return (
    <div className="michie-box" style={{ padding: 10, minWidth: 0 }}>
      <div className="michie-text-secondary" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div
        className="michie-text-secondary"
        style={{ fontSize: 16, fontWeight: 600, color: warn ? "#e0a030" : undefined }}
      >
        {value}
      </div>
    </div>
  );
}

export function SpectralAnalysisWidget() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const songPath = currentSong?.path ?? null;

  const analysis = useSpectralStore((s) => (songPath ? s.results[songPath] : undefined));
  const loading = useSpectralStore((s) => (songPath ? !!s.scanning[songPath] : false));
  const error = useSpectralStore((s) => (songPath ? s.errors[songPath] : undefined));
  const ensureChecked = useSpectralStore((s) => s.ensureChecked);
  const scan = useSpectralStore((s) => s.scan);
  const checked = useSpectralStore((s) => (songPath ? songPath in s.results : false));

  // Tiap ganti lagu: cek cache DB (bukan analisis ulang -- widget cuma kerja
  // kalau tombol Scan ditekan). Kalau widget lain sudah pernah nge-scan
  // lagu yang sama, hasilnya langsung ada di sini tanpa perlu scan lagi.
  useEffect(() => {
    if (songPath) ensureChecked(songPath);
  }, [songPath, ensureChecked]);

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
      className=""
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 className="michie-text-secondary" style={{ margin: 0, fontSize: 15 }}>
          Analisis Spektral
        </h3>
        <button
          onClick={() => scan(songPath)}
          disabled={loading}
          className="michie-box michie-box--secondary michie-text-primary"
          style={{
            padding: "6px 14px",
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontSize: 13,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Analyzing..." : analysis ? "Rescan" : "Scan"}
        </button>
      </div>

      {error && <p style={{ color: "#e05555", margin: 0, fontSize: 13 }}>{error}</p>}

      {!analysis && checked && !loading && !error && (
        <p className="michie-text-secondary" style={{ margin: 0, fontSize: 13 }}>
          This song has not been analyzed yet. Press "Scan" to inspect the frequency response and file quality.
        </p>
      )}

      {analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Metric label="Peak Frequency" value={formatHz(analysis.peak_frequency_hz)} />
          <Metric
            label="Frequency Range"
            value={`${formatHz(analysis.freq_min_hz)} – ${formatHz(analysis.freq_max_hz)}`}
          />
          <Metric label="Dynamic Range" value={`${analysis.dynamic_range_db.toFixed(1)} dB`} />
          <Metric
            label="Spectral Cutoff"
            value={formatHz(analysis.spectral_cutoff_hz)}
            warn={analysis.likely_transcoded}
          />
        </div>
      )}

      {analysis?.likely_transcoded && (
        <div className="michie-box michie-box--secondary" style={{ padding: 10 }}>
          <strong className="michie-text-secondary" style={{ fontSize: 13 }}>
            ⚠ This may not be genuine lossless audio
          </strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            High frequencies are sharply cut around {formatHz(analysis.spectral_cutoff_hz)} —
            a common pattern for files transcoded from lossy sources (mp3/aac) and then repackaged
            as lossless. Check the "Spectrogram" widget to view this pattern visually.
          </p>
        </div>
      )}
    </div>
  );
}

export default SpectralAnalysisWidget;