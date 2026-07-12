import { useEffect, useRef } from "react";
import { subscribeVisualizer } from "../../services/visualizerService";
import "./visualizer.css";

const BEAT_BAND_END = 8; // pakai band 0..7 (bass + low-mid) sebagai sumber "denyut"
const MAX_EXTRA_SCALE = 0.55;

export default function PulsingBlob() {
  const blobRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeVisualizer((levels) => {
      const el = blobRef.current;
      if (!el) return;
      const slice = levels.slice(0, BEAT_BAND_END);
      const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
      const clamped = Math.max(0, Math.min(1, avg));
      el.style.transform = `scale(${1 + clamped * MAX_EXTRA_SCALE})`;
    });
    return unsubscribe;
  }, []);

  return (
    <div
      className="pulsing-blob speaker-texture"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={blobRef}
        className="michie-circle michie-circle--secondary pulsing-blob__circle"
        style={{ width: "42%", aspectRatio: "1" }}
      />
    </div>
  );
}