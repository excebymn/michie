import { usePlayerStore } from "../../stores/playerStore";
import { useLyricsStore, type LrcLine } from "../../stores/lyricsStore";
import { PlainLyrics } from "../shared/PlainLyrics";
import { CandidatePicker } from "../shared/CandidatePicker";

export function LyricsFlipWidget() {
  const phase = useLyricsStore((s) => s.phase);
  const pickCandidate = useLyricsStore((s) => s.pickCandidate);
  const songProgress = usePlayerStore((s) => s.songProgress);

  return (
    <div className="widget-lyrics-flip">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Loading lyrics...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lyrics not found</div>
      )}

      {phase.kind === "plain" && <PlainLyrics lines={phase.lines} />}

      {phase.kind === "synced" && <SyncedFlipLyrics lines={phase.lines} progress={songProgress} />}

      {phase.kind === "selecting" && (
        <CandidatePicker candidates={phase.candidates} onPick={pickCandidate} />
      )}

      <style>{`
        .widget-lyrics-flip {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
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

function SyncedFlipLyrics({ lines, progress }: { lines: LrcLine[]; progress: number }) {
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress) activeIndex = i;
    else break;
  }

  const currentText = activeIndex >= 0 ? lines[activeIndex].text : "\u266A";

  return (
    <div className="lyric-flip-viewport">
      {/* re-render dipicu via key reaktif untuk menjamin reset animasi CSS */}
      <div className="lyric-flip-card" key={activeIndex}>
        <div className="lyric-flip-box michie-box--secondary">
          <div className="lyric-flip-text michie-text-primary">
            {currentText || "\u266A"}
          </div>
        </div>
      </div>

      <style>{`
        .lyric-flip-viewport {
          perspective: 1200px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lyric-flip-card {
          width: 100%;
          max-width: 92%;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, opacity;
          animation: lyricSmoothFlipIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .lyric-flip-box {
          padding: 1.25rem 1.5rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 4.8rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 16px -6px rgba(0, 0, 0, 0.1);
          text-align: center;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0); 
        }

        .lyric-flip-text {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.45;
          word-break: break-word;
          white-space: normal;
        }

        @keyframes lyricSmoothFlipIn {
          0% {
            transform: rotateX(-75deg) translateY(15px) scale(0.95);
            opacity: 0;
            filter: blur(5px);
          }
          50% {
            filter: blur(2px);
          }
          85% {
            transform: rotateX(3deg) translateY(-1px) scale(1.01);
          }
          100% {
            transform: rotateX(0deg) translateY(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }
      `}</style>
    </div>
  );
}