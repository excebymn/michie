import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useLyricsStore, type LrcLine } from "../../stores/lyricsStore";
import { PlainLyrics } from "../shared/PlainLyrics";
import { CandidatePicker } from "../shared/CandidatePicker";

export function LyricsWidget() {
  const phase = useLyricsStore((s) => s.phase);
  const pickCandidate = useLyricsStore((s) => s.pickCandidate);
  const songProgress = usePlayerStore((s) => s.songProgress);

  return (
    <div className="widget-lyrics">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Loading lyrics...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lyrics not found</div>
      )}

      {phase.kind === "plain" && <PlainLyrics lines={phase.lines} />}

      {phase.kind === "synced" && <SyncedLyrics lines={phase.lines} progress={songProgress} />}

      {phase.kind === "selecting" && (
        <CandidatePicker candidates={phase.candidates} onPick={pickCandidate} />
      )}

      <style>{`
        .widget-lyrics {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
        }

        .widget-lyrics-status {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          opacity: 0.7;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// Baris ditampilin apa adanya (semua baris, bukan cuma 2), di-scroll biasa.
// Baris aktif = baris terakhir yang timestamp-nya sudah lewat progress lagu.
function SyncedLyrics({ lines, progress }: { lines: LrcLine[]; progress: number }) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress) activeIndex = i;
    else break;
  }

  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  return (
    <div className="widget-lyrics-scroll">
      <div className="widget-lyrics-spacer" aria-hidden />
      {lines.map((line, i) => (
        <div
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          className={
            i === activeIndex
              ? "widget-lyrics-line widget-lyrics-line--active michie-text-secondary"
              : "widget-lyrics-line michie-text-secondary"
          }
        >
          {line.text || "\u266A"}
        </div>
      ))}
      <div className="widget-lyrics-spacer" aria-hidden />

      <style>{`
        .widget-lyrics-scroll {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          padding: 0 1rem;
          scrollbar-width: none;
        }
        .widget-lyrics-scroll::-webkit-scrollbar {
          display: none;
        }

        .widget-lyrics-spacer {
          flex: 0 0 42%;
        }

        .widget-lyrics-line {
          text-align: center;
          font-size: 0.95rem;
          font-weight: 500;
          opacity: 0.35;
          text-shadow: none;
          transition: opacity 0.35s ease, font-size 0.35s ease, font-weight 0.35s ease, text-shadow 0.35s ease;
        }

        .widget-lyrics-line--active {
          font-size: 1.4rem;
          font-weight: 800;
          opacity: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45), 0 4px 16px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
}