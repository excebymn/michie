import { useEffect, useState } from "react";
import "./LoadingScreen.css";

// Status messages are purely cosmetic — not actual loading progress.
// Real startup progress isn't meaningful to display here since we're
// simply waiting for a few async tasks to complete.
const STATUS_MESSAGES = [
  "Waking up the turntable",
  "Dusting off the stylus",
  "Organizing the vinyl collection",
  "Synchronizing the tempo",
  "Warming up the speakers",
];

const WORDMARK = "Michie";

type Props = {
  /** True when startup has finished and the overlay is fading out. */
  exiting: boolean;
};

export default function LoadingScreen({ exiting }: Props) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (exiting) return;
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 500);
    return () => window.clearInterval(id);
  }, [exiting]);

  return (
    <div
      className={"loading-screen" + (exiting ? " loading-screen--exit" : "")}
      role="status"
      aria-live="polite"
      aria-label="Michie is loading"
    >
      <div className="loading-screen__rig">
        {/* Tonearm: theme accent, independent of the vinyl color */}
        <div className="loading-screen__tonearm michie-bg-secondary" />

        {/* Vinyl record: intentionally uses a fixed material color */}
        <div className="loading-screen__disc">
          <div className="loading-screen__label michie-circle michie-circle--secondary michie-text-primary">
            M
          </div>
          <div className="loading-screen__spindle" />
        </div>
      </div>

      <div className="loading-screen__wordmark michie-text-primary">
        {WORDMARK.split("").map((char, i) => (
          <span key={i} style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
            {char}
          </span>
        ))}
      </div>

      <div className="loading-screen__eq" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="michie-bg-primary"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>

      <p className="loading-screen__status michie-text-secondary">
        {STATUS_MESSAGES[statusIndex]}…
      </p>
    </div>
  );
}