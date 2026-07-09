import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const BAR_COUNT = 20; // total bar tampil (10 kiri + 10 kanan)
const HALF_COUNT = BAR_COUNT / 2;
const MIN_HEIGHT_PCT = 4; // % dari tinggi container
const MAX_HEIGHT_PCT = 70; // % dari tinggi container

export default function Visualizer() {
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    const setup = async () => {
      const ul1 = await onEvent<{ levels: number[] }>(
        "visualizer-levels",
        (e) => {
          // Simetris: kedua sisi nampilin band frekuensi yang SAMA (mirror),
          // cuma pakai separuh pertama dari 20 band yang dikirim backend.
          for (let i = 0; i < HALF_COUNT; i++) {
            const level = e.payload.levels[i] ?? 0;
            const clamped = Math.max(0, Math.min(1, level));
            const heightPct =
              MIN_HEIGHT_PCT + clamped * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT);

            const leftEl = leftRefs.current[i];
            if (leftEl) leftEl.style.height = `${heightPct}%`;

            const rightEl = rightRefs.current[i];
            if (rightEl) rightEl.style.height = `${heightPct}%`;
          }
        },
      );

      unlisteners.current = [ul1].filter(Boolean) as Array<() => void>;
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      className="visualizer"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 12,
        width: "100%",
        height: "100%",
        padding: "0 12px",
      }}
    >
      <div className="visualizer-half visualizer-half--left">
        {Array.from({ length: HALF_COUNT }, (_, i) => (
          <div
            key={`left-${i}`}
            ref={(el) => {
              leftRefs.current[i] = el;
            }}
            className="michie-box--secondary visualizer__bar"
            style={{ flex: 1, width: 10, height: `${MIN_HEIGHT_PCT}%` }}
          />
        ))}
      </div>

      <div className="visualizer-half visualizer-half--right">
        {Array.from({ length: HALF_COUNT }, (_, i) => (
          <div
            key={`right-${i}`}
            ref={(el) => {
              rightRefs.current[i] = el;
            }}
            className="michie-box--secondary visualizer__bar"
            style={{ flex: 1, width: 10, height: `${MIN_HEIGHT_PCT}%` }}
          />
        ))}
      </div>
    </div>
  );
}