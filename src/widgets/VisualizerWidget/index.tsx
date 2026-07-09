import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const BAR_COUNT = 20;
const MIN_HEIGHT_PCT = 4; // % dari tinggi container
const MAX_HEIGHT_PCT = 70; // % dari tinggi container — sesuai request kamuconst MAX_HEIGHT = 300;

export default function Visualizer() {
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
            el.style.height = `${MIN_HEIGHT_PCT + clamped * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT)}%`;
          });
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
            style={{ flex: 1, width: 10, height: `${MIN_HEIGHT_PCT}%` }}
          />
        ))}
      </div>

  );
}
