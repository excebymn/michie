import type { CSSProperties } from "react";
import { Music } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";

import "./queueViewer.css";

// How many cards are actually visible in the stack (current + 4 next).
const VISIBLE_COUNT = 5;

// Extra hidden slots kept mounted on each side so cards have somewhere to
// animate *from* / *to* when they enter or leave the visible stack.
const BUFFER = 2;

// How far (in % of the stack width) each step in the stack shifts a card.
const STEP_PERCENT = 13.5;

export function QueueCard() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const offsets: number[] = [];
  for (let o = -BUFFER; o < VISIBLE_COUNT + BUFFER; o++) {
    offsets.push(o);
  }

  const cards = offsets
    .map((offset) => {
      const index = currentIndex + offset;
      const song = queue[index];
      return song ? { offset, index, song } : null;
    })
    .filter((c): c is { offset: number; index: number; song: (typeof queue)[number] } => c !== null);

  return (
    <div className="queue-viewer">
      {cards.map(({ offset, index, song }) => {
        const visible = offset >= 0 && offset < VISIBLE_COUNT;

        const style: CSSProperties = {
          transform: `translateX(${offset * STEP_PERCENT}%)`,
          opacity: visible ? 1 : 0,
          zIndex: VISIBLE_COUNT - offset,
          pointerEvents: offset === 0 ? "auto" : "none",
        };

        return (
          <div key={index} className="queue-card" style={style}>
            {song.cover ? (
              <img
                src={`asset://localhost/${song.cover}`}
                alt={song.album ?? "Album Art"}
                className="queue-card-art"
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="queue-card-placeholder">
                <Music size={28} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}