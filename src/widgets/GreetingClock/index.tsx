import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function ClockWidgetGreeting() {
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
  });

  const greeting = getGreeting(now.getHours());

  return (
    <div className="widget-clock-greeting">
      <div className="widget-clock-greeting-label michie-box michie-box--secondary">{greeting}</div>

      <div className="widget-clock-greeting-time michie-text-secondary">
        {time}
      </div>

      <div className="widget-clock-greeting-date michie-text-secondary">
        {date}
      </div>

      <style>{`
        .widget-clock-greeting {
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

        .widget-clock-greeting-label {
          font-size: clamp(0.75rem, 1.8vw, 0.95rem);
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-primary);
          margin-bottom: 0.35rem;
        }

        .widget-clock-greeting-time {
          font-size: clamp(2.6rem, 8vw, 4.8rem);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .widget-clock-greeting-date {
          margin-top: 0.5rem;
          font-size: clamp(0.8rem, 1.9vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}