import { useEffect, useRef } from "react";
import { subscribeVisualizer } from "../../services/visualizerService";
import "./visualizer.css";

const BAR_COUNT = 20; // total bar tampil (10 kiri + 10 kanan)
const HALF_COUNT = BAR_COUNT / 2;
const MIN_HEIGHT_PCT = 4; // % dari tinggi container
const MAX_HEIGHT_PCT = 70; // % dari tinggi container

export default function Visualizer() {
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeVisualizer((levels) => {
      // Simetris: kedua sisi nampilin band frekuensi yang SAMA (mirror),
      // cuma pakai separuh pertama dari 20 band yang dikirim backend.
      for (let i = 0; i < HALF_COUNT; i++) {
        const level = levels[i] ?? 0;
        const clamped = Math.max(0, Math.min(1, level));
        const heightPct =
          MIN_HEIGHT_PCT + clamped * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT);
        // scaleY lewat transform, bukan height — hindari layout reflow tiap
        // frame. Elemen sendiri height-nya FIXED 100% (lihat JSX di bawah).
        const scale = heightPct / 100;

        const leftEl = leftRefs.current[i];
        if (leftEl) leftEl.style.transform = `scaleY(${scale})`;

        const rightEl = rightRefs.current[i];
        if (rightEl) rightEl.style.transform = `scaleY(${scale})`;
      }
    });

    return unsubscribe;
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
            style={{
              flex: 1,
              width: 10,
              height: "100%", // FIXED — panjang divariasikan lewat scaleY
              transform: `scaleY(${MIN_HEIGHT_PCT / 100})`,
            }}
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
            style={{
              flex: 1,
              width: 10,
              height: "100%", // FIXED — panjang divariasikan lewat scaleY
              transform: `scaleY(${MIN_HEIGHT_PCT / 100})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}