import { useEffect, useState } from "react";

export function ClockWidgetSplit() {
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

  const day = now.getDate();
  const weekday = now.toLocaleDateString([], { weekday: "short" });
  const month = now.toLocaleDateString([], { month: "short" });
  const year = now.getFullYear();

  return (
    <div className="widget-clock-split">
      <div className="widget-clock-split-time michie-text-secondary">
        {time}
      </div>

      <div className="widget-clock-split-divider" />

      <div className="widget-clock-split-card">
        <span className="widget-clock-split-card-weekday">{weekday}</span>
        <span className="widget-clock-split-card-day">{day}</span>
        <span className="widget-clock-split-card-month">
          {month} {year}
        </span>
      </div>

      <style>{`
        .widget-clock-split {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          padding: 1rem 1.25rem;
          box-sizing: border-box;
          gap: 1.1rem;
          user-select: none;
        }

        .widget-clock-split-time {
          font-size: clamp(4rem, 8vw, 4.2rem);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.05em;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
          flex: 1;
          text-align: right;
        }

        .widget-clock-split-divider {
          width: 1px;
          align-self: stretch;
          background: var(--color-secondary);
          opacity: 0.3;
        }

        .widget-clock-split-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 3.6rem;
        }

        .widget-clock-split-card-weekday {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-primary);
        }

        .widget-clock-split-card-day {
          font-size: clamp(1.6rem, 4.5vw, 2.4rem);
          font-weight: 800;
          line-height: 1.05;
          font-variant-numeric: tabular-nums;
        }

        .widget-clock-split-card-month {
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.65;
        }
      `}</style>
    </div>
  );
}