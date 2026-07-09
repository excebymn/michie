import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const COLS = 20; // 1 kolom = 1 band
const ROWS = 10;

export default function DotGridVisualizer() {
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]); // flat: index = col * ROWS + row
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    const setup = async () => {
      const ul1 = await onEvent<{ levels: number[] }>(
        "visualizer-levels",
        (e) => {
          for (let c = 0; c < COLS; c++) {
            const level = e.payload.levels[c] ?? 0;
            const clamped = Math.max(0, Math.min(1, level));
            const litCount = Math.round(clamped * ROWS);

            for (let r = 0; r < ROWS; r++) {
              const el = dotRefs.current[c * ROWS + r];
              if (!el) continue;
              // r dihitung dari bawah (lihat column-reverse di JSX), jadi
              // r < litCount berarti dot ini termasuk yang "menyala".
              el.classList.toggle("dot-grid__dot--lit", r < litCount);
            }
          }
        },
      );
      unlisteners.current = [ul1].filter(Boolean) as Array<() => void>;
    };
    setup();
    return () => unlisteners.current.forEach((fn) => fn());
  }, []);

  return (
    <div
      className="dot-grid"
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 4,
        width: "100%",
        height: "100%",
        padding: "0 12px",
      }}
    >
      {Array.from({ length: COLS }, (_, c) => (
        <div key={c} className="dot-grid__col">
          {Array.from({ length: ROWS }, (_, r) => (
            <div
              key={r}
              ref={(el) => {
                dotRefs.current[c * ROWS + r] = el;
              }}
              className="michie-circle--secondary dot-grid__dot"
            />
          ))}
        </div>
      ))}
    </div>
  );
}