import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const BAND_COUNT = 20;
const BASE_LEN = 14; // px, panjang minimum jari-jari
const MAX_EXTRA_LEN = 46; // px, tambahan panjang maksimum saat level tinggi

export default function RadialVisualizer() {
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
            el.style.height = `${BASE_LEN + clamped * MAX_EXTRA_LEN}px`;
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
      className="radial-visualizer"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {Array.from({ length: BAND_COUNT }, (_, i) => {
        const angle = (i * 360) / BAND_COUNT;
        return (
          <div
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="michie-box--secondary radial-visualizer__bar"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 5,
              height: BASE_LEN,
              // Statis — cuma di-set sekali, gak diubah di event handler.
              // Pivot rotasi ada di titik tengah container (top edge elemen ini).
              transform: `translate(-50%, 0) rotate(${angle}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}