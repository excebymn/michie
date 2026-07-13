import { usePlayerStore } from "../../stores/playerStore";
import { useLyricsStore, type LrcLine } from "../../stores/lyricsStore";
import { PlainLyrics } from "../shared/PlainLyrics";
import { CandidatePicker } from "../shared/CandidatePicker";

export function LyricsKaraokeWidget() {
  const phase = useLyricsStore((s) => s.phase);
  const pickCandidate = useLyricsStore((s) => s.pickCandidate);
  const songProgress = usePlayerStore((s) => s.songProgress);

  return (
    <div className="widget-lyrics-karaoke">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Loading lyrics...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lyrics not found</div>
      )}

      {phase.kind === "plain" && <PlainLyrics lines={phase.lines} />}

      {phase.kind === "synced" && <SyncedKaraokeLyrics lines={phase.lines} progress={songProgress} />}

      {phase.kind === "selecting" && (
        <CandidatePicker candidates={phase.candidates} onPick={pickCandidate} />
      )}

      <style>{`
        .widget-lyrics-karaoke {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .widget-lyrics-status {
          font-size: 0.95rem;
          opacity: 0.7;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function SyncedKaraokeLyrics({ lines, progress }: { lines: LrcLine[]; progress: number }) {
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress) activeIndex = i;
    else break;
  }

  const currentLine = lines[activeIndex];
  const nextLine = lines[activeIndex + 1];

  const currentText = activeIndex >= 0 ? currentLine.text : "\u266A";
  const nextText = nextLine ? nextLine.text : "";

  let progressPercent = 0;
  if (currentLine) {
    const startTime = currentLine.time;
    const endTime = nextLine ? nextLine.time : startTime + 4;
    const duration = endTime - startTime;
    if (duration > 0) {
      progressPercent = Math.min(100, Math.max(0, ((progress - startTime) / duration) * 100));
    }
  }

  return (
    <div className="karaoke-view" key={activeIndex}>
      <div className="karaoke-row-active michie-box--secondary">
        <div className="karaoke-text-base michie-text-secondary">
          {currentText || "\u00A0"}
        </div>
        <div
          className="karaoke-text-fill michie-text-primary"
          style={{ width: `${progressPercent}%` }}
        >
          {currentText || "\u00A0"}
        </div>
      </div>

      {nextText && (
        <div className="karaoke-row-next michie-text-secondary animate-fade-in">
          Next: {nextText}
        </div>
      )}

      <style>{`
        .karaoke-view {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .karaoke-row-active {
          position: relative;
          width: 100%;
          max-width: 95%;
          padding: 1.5rem;
          border-radius: 14px;
          min-height: 5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px -6px rgba(0,0,0,0.12);
          overflow: hidden;
        }

        .karaoke-text-base, .karaoke-text-fill {
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1.4;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
          position: absolute;
          width: 100%;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }

        .karaoke-text-base {
          opacity: 0.25;
        }

        .karaoke-text-fill {
          left: 0;
          text-align: left;
          padding-left: calc(50% - (100% - 3rem)/2);
          white-space: nowrap;
          transition: width 0.15s linear; 
          border-right: 2px solid var(--color-primary);
        }

        .karaoke-row-next {
          font-size: 0.85rem;
          font-weight: 500;
          opacity: 0.4;
          text-align: center;
          font-style: italic;
          max-width: 80%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 0.4; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
}