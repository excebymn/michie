import { useEffect, useState } from "react";

export function ClockWidgetAnalog() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  const date = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <div className="widget-clock-analog">
      <svg viewBox="0 0 200 200" className="widget-clock-analog-face">
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="2"
          opacity="0.35"
        />

        {ticks.map((deg) => (
          <line
            key={deg}
            x1="100"
            y1="10"
            x2="100"
            y2={deg % 90 === 0 ? "22" : "18"}
            stroke="var(--color-secondary)"
            strokeWidth={deg % 90 === 0 ? 3 : 1.5}
            opacity="0.6"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}

        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="var(--color-secondary)"
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${hourDeg} 100 100)`}
        />

        <line
          x1="100"
          y1="100"
          x2="100"
          y2="32"
          stroke="var(--color-secondary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${minuteDeg} 100 100)`}
        />

        <line
          x1="100"
          y1="112"
          x2="100"
          y2="24"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${secondDeg} 100 100)`}
        />

        <circle cx="100" cy="100" r="4" fill="var(--color-primary)" />
      </svg>

      <div className="widget-clock-analog-date michie-text-secondary">
        {date}
      </div>

      <style>{`
        .widget-clock-analog {
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
          gap: 0.65rem;
        }

        .widget-clock-analog-face {
          width: min(60%, 11rem);
          height: auto;
        }

        .widget-clock-analog-date {
          font-size: clamp(0.8rem, 1.8vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}