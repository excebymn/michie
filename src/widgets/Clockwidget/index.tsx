import { useEffect, useState } from "react";

export function ClockWidget() {
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

  const date = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="widget-clock">
      <div className="widget-clock-time michie-text-secondary">
        {time}
      </div>

      <div className="widget-clock-date michie-text-secondary">
        {date}
      </div>

      <style>{`
        .widget-clock {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          text-align: center;
          user-select: none;
          padding: 1rem;
          box-sizing: border-box;
        }

        .widget-clock-time {
          font-size: clamp(3rem, 9vw, 5.5rem);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .widget-clock-date {
          margin-top: 0.65rem;
          font-size: clamp(0.85rem, 2vw, 1.1rem);
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}