import { useEffect, useRef } from "react";
import { subscribeVisualizer } from "../../services/visualizerService";
import "./visualizer.css";

const BAND_COUNT = 20;
const BASE_LEN = 14; // px, panjang minimum jari-jari
const MAX_EXTRA_LEN = 46; // px, tambahan panjang maksimum saat level tinggi
const MAX_LEN = BASE_LEN + MAX_EXTRA_LEN; // panjang penuh elemen — FIXED, gak pernah diubah lagi

export default function RadialVisualizer() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeVisualizer((levels) => {
      levels.forEach((level, i) => {
        const el = barRefs.current[i];
        if (!el) return;
        const clamped = Math.max(0, Math.min(1, level));
        const len = BASE_LEN + clamped * MAX_EXTRA_LEN;
        const angle = (i * 360) / BAND_COUNT;
        // scaleY lewat transform (compositor-only, GPU) — jauh lebih murah
        // daripada ubah `height` (yang memicu layout/reflow tiap elemen tiap frame).
        el.style.transform = `translate(-50%, 0) rotate(${angle}deg) scaleY(${len / MAX_LEN})`;
      });
    });
    return unsubscribe;
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
              // Height sekarang FIXED ke panjang maksimum — variasi panjang
              // dikerjakan lewat scaleY di transform, bukan ubah height.
              height: MAX_LEN,
              transform: `translate(-50%, 0) rotate(${angle}deg) scaleY(${BASE_LEN / MAX_LEN})`,
            }}
          />
        );
      })}
    </div>
  );
}