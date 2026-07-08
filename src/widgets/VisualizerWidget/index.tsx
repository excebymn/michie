import { useEffect, useRef } from "react";

export default function VisualizerWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smooth = useRef(new Float32Array(16));

  useEffect(() => {
    let animationId = 0;

    const render = () => {
      animationId = requestAnimationFrame(render);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      const style = getComputedStyle(document.documentElement);

      const primary =
        style.getPropertyValue("--color-primary").trim() || "#ffffff";

      ctx.fillStyle = primary;

      // ============================================
      // Dummy Data
      // nanti ganti dengan playerStore.visualizer
      // ============================================

      const bars = Array.from(
        { length: 16 },
        () => Math.random()
      );

      // ============================================

      const count = bars.length;

      const gap = 8;

      const barWidth =
        (width - gap * (count - 1)) / count;

      for (let i = 0; i < count; i++) {
        smooth.current[i] +=
          (bars[i] - smooth.current[i]) * 0.15;

        const value = smooth.current[i];

        const h = Math.max(6, value * (height - 8));

        const x = i * (barWidth + gap);

        const y = height - h;

        ctx.beginPath();

        ctx.roundRect(
          x,
          y,
          barWidth,
          h,
          999
        );

        ctx.fill();
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      className="michie-box michie-box--primary"
      style={{
        width: "100%",
        height: "100%",
        padding: 20,
        display: "flex",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 70,
          display: "block",
        }}
      />
    </div>
  );
}