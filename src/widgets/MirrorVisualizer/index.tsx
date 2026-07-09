import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const BAND_COUNT = 20; // harus sama dengan BAND_COUNT di visualizer.rs
const MAX_SCALE = 9; // seberapa jauh bar bisa "memanjang" dari tinggi dasarnya

export default function MirrorVisualizer() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    const setup = async () => {
      const ul1 = await onEvent<{ levels: number[] }>(
        "visualizer-levels",
        (e) => {
          e.payload.levels.forEach((level, i) => {
            const el = barRefs.current[i];
            if (!el) return;
            const clamped = Math.max(0, Math.min(1, level));
            el.style.transform = `scaleY(${1 + clamped * (MAX_SCALE - 1)})`;
          });
        },
      );
      unlisteners.current = [ul1].filter(Boolean) as Array<() => void>;
    };
    setup();
    return () => unlisteners.current.forEach((fn) => fn());
  }, []);

  return (
    <div
      className="mirror-visualizer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        height: "100%",
        padding: "0 12px",
      }}
    >
      {Array.from({ length: BAND_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="michie-box--secondary mirror-visualizer__bar"
          style={{ flex: 1, width: 10, height: "6%" }}
        />
      ))}
    </div>
  );
}