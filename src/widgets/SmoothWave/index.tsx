import { useEffect, useRef } from "react";
import { onEvent } from "../../services/api";
import "./visualizer.css";

const BAND_COUNT = 20;
const VIEW_W = 1000;
const VIEW_H = 200;

// Kurva halus lewat titik tengah antar-titik (quadratic through-midpoints) —
// gak butuh library, cukup dengan komando SVG "Q" bawaan.
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1].x + points[i].x) / 2;
    const midY = (points[i - 1].y + points[i].y) / 2;
    d += ` Q ${points[i - 1].x} ${points[i - 1].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export default function SmoothWave() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    const setup = async () => {
      const ul1 = await onEvent<{ levels: number[] }>(
        "visualizer-levels",
        (e) => {
          const path = pathRef.current;
          const area = areaRef.current;
          if (!path || !area) return;

          const step = VIEW_W / (BAND_COUNT - 1);
          const points = e.payload.levels.map((level, i) => {
            const clamped = Math.max(0, Math.min(1, level));
            return { x: i * step, y: VIEW_H - clamped * VIEW_H };
          });

          const line = buildSmoothPath(points);
          path.setAttribute("d", line);
          // Area di bawah kurva - path yang sama + turun ke dasar + balik ke awal
          area.setAttribute(
            "d",
            `${line} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`,
          );
        },
      );
      unlisteners.current = [ul1].filter(Boolean) as Array<() => void>;
    };
    setup();
    return () => unlisteners.current.forEach((fn) => fn());
  }, []);

  return (
    <div className="smooth-wave" style={{ width: "100%", height: "100%" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        <path ref={areaRef} className="smooth-wave__area" d="" />
        <path
          ref={pathRef}
          className="smooth-wave__line"
          d=""
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}