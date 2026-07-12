import { useEffect, useRef } from "react";
import { subscribeVisualizer } from "../../services/visualizerService";
import "./visualizer.css";

const BAR_COUNT = 20;
const MIN_HEIGHT_PCT = 4; // % dari tinggi container
const MAX_HEIGHT_PCT = 70; // % dari tinggi container

export default function Visualizer() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeVisualizer((levels) => {
      levels.forEach((level, i) => {
        const el = barRefs.current[i];
        if (!el) return;
        const clamped = Math.max(0, Math.min(1, level));
        const pct = MIN_HEIGHT_PCT + clamped * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT);
        // scaleY lewat transform, bukan height — hindari layout reflow tiap frame.
        // Elemen sendiri height-nya udah FIXED 100% (lihat JSX di bawah).
        el.style.transform = `scaleY(${pct / 100})`;
      });
    });
    return unsubscribe;
  }, []);

  return (
    <div
      className="visualizer visualizer-container"
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        height: "100%",
        padding: "0 12px",
      }}
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="michie-box--secondary visualizer__bar"
          style={{
            flex: 1,
            width: 10,
            height: "100%", // FIXED — panjang divariasikan lewat scaleY di transform
            transform: `scaleY(${MIN_HEIGHT_PCT / 100})`,
          }}
        />
      ))}
    </div>
  );
}