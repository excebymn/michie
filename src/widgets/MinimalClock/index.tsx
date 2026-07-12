import { useEffect, useState } from "react";

export function ClockWidgetMinimal() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="widget-clock-minimal">
      <div className="widget-clock-minimal-time michie-text-secondary">
        {time}
      </div>

      <style>{`
        .widget-clock-minimal {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          user-select: none;
        }

        .widget-clock-minimal-time {
          font-size: clamp(3.5rem, 12vw, 7rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.08em;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
      `}</style>
    </div>
  );
}