import { useEffect, useRef } from "react";
import { useEqualizerStore } from "../../stores/equalizerStore";
import "./equalizer-curve.css";

const MIN_GAIN = -12;
const MAX_GAIN = 12;
const GAIN_STEP = 0.5;

// Koordinat internal SVG (viewBox) - discale otomatis ke ukuran container
// lewat preserveAspectRatio="none", jadi angka ini gak perlu match pixel asli.
const WIDTH = 600;
const HEIGHT = 200;
const PAD_X = 24;
const PAD_Y = 14;

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
}

function xForIndex(index: number, count: number): number {
  if (count <= 1) return WIDTH / 2;
  return PAD_X + (index / (count - 1)) * (WIDTH - PAD_X * 2);
}

function yForGain(gain: number): number {
  const usableHalf = HEIGHT / 2 - PAD_Y;
  return HEIGHT / 2 - (gain / MAX_GAIN) * usableHalf;
}

// Catmull-Rom -> cubic Bezier, biar garis antar titik melengkung mulus
// alih-alih patah-patah kayak polyline biasa.
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function EqualizerCurve() {
  const bands = useEqualizerStore((s) => s.bands);
  const enabled = useEqualizerStore((s) => s.enabled);
  const loaded = useEqualizerStore((s) => s.loaded);
  const fetchInitial = useEqualizerStore((s) => s.fetchInitial);
  const setBandGain = useEqualizerStore((s) => s.setBandGain);
  const setEnabled = useEqualizerStore((s) => s.setEnabled);
  const reset = useEqualizerStore((s) => s.reset);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    const updateFromClientY = (clientY: number) => {
      const rect = svg.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const scaledY = (relativeY / rect.height) * HEIGHT;
      const usableHalf = HEIGHT / 2 - PAD_Y;
      const gain = ((HEIGHT / 2 - scaledY) / usableHalf) * MAX_GAIN;
      const clamped = Math.max(MIN_GAIN, Math.min(MAX_GAIN, gain));
      const rounded = Math.round(clamped / GAIN_STEP) * GAIN_STEP;
      setBandGain(index, rounded);
    };

    updateFromClientY(e.clientY);

    // Window-level listener (bukan pointer capture di elemen SVG) — pola
    // yang sama dipakai buat fix drag di progress slider webkit2gtk sebelumnya.
    const handleMove = (ev: PointerEvent) => updateFromClientY(ev.clientY);
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  if (!loaded) {
    return <div className="equalizer-curve equalizer-curve--loading" />;
  }

  const points = bands.map((band, i) => ({
    x: xForIndex(i, bands.length),
    y: yForGain(band.gain_db),
  }));
  const pathData = smoothPath(points);

  return (
    <div className={`equalizer-curve${!enabled ? " equalizer-curve--bypassed" : ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="equalizer-curve__svg"
      >
        <line
          x1={0}
          y1={HEIGHT / 2}
          x2={WIDTH}
          y2={HEIGHT / 2}
          className="equalizer-curve__zero-line"
        />
        <path d={pathData} className="equalizer-curve__path" fill="none" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={7}
              className="michie-circle--primary equalizer-curve__point"
              onPointerDown={startDrag(i)}
              onDoubleClick={() => setBandGain(i, 0)}
            />
            <text x={p.x} y={HEIGHT - 2} className="equalizer-curve__freq-label michie-text-secondary">
              {formatFreq(bands[i].frequency)}
            </text>
          </g>
        ))}
      </svg>

      <div className="equalizer-curve__controls">
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
          className="michie-box--secondary equalizer-curve__reset michie-text-primary"
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}