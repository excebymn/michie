import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { lyricsService } from "../../services/lyricsService";
import { parseLrc, type LrcLine } from "./parseLrc";
import type { LyricsCandidate, LyricsLookupResult } from "../../types/lyrics";

type LyricsPhase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "selecting"; candidates: LyricsCandidate[] }
  | { kind: "synced"; lines: LrcLine[] }
  | { kind: "plain"; lines: string[] };

export function LyricsFlipWidget() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const songProgress = usePlayerStore((s) => s.songProgress);
  const [phase, setPhase] = useState<LyricsPhase>({ kind: "loading" });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const path = currentSong?.path;
    if (!path) {
      setPhase({ kind: "empty" });
      return;
    }

    const requestId = ++requestIdRef.current;
    setPhase({ kind: "loading" });

    lyricsService
      .findLyricsCandidates(path)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        applyResult(result);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setPhase({ kind: "empty" });
      });
  }, [currentSong?.path]);

  function applyResult(result: LyricsLookupResult) {
    if (result.status === "cached" || result.status === "auto_matched") {
      applyLyrics(result.lyrics.synced_lyrics, result.lyrics.plain_lyrics);
    } else if (result.status === "needs_selection") {
      setPhase({ kind: "selecting", candidates: result.candidates });
    } else {
      setPhase({ kind: "empty" });
    }
  }

  function applyLyrics(synced: string | null, plain: string | null) {
    if (synced && synced.trim().length > 0) {
      const lines = parseLrc(synced);
      if (lines.length > 0) {
        setPhase({ kind: "synced", lines });
        return;
      }
    }
    if (plain && plain.trim().length > 0) {
      const lines = plain.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        setPhase({ kind: "plain", lines });
        return;
      }
    }
    setPhase({ kind: "empty" });
  }

  async function pickCandidate(candidate: LyricsCandidate) {
    if (!currentSong?.path) return;
    await lyricsService.updateRemoteLyrics(
      currentSong.path,
      candidate.syncedLyrics ?? "",
      candidate.plainLyrics ?? "",
      candidate.id,
    );
    applyLyrics(candidate.syncedLyrics, candidate.plainLyrics);
  }

  return (
    <div className="widget-lyrics-flip">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Memuat lirik...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lirik tidak ditemukan</div>
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
          /* Kurva bezier elastis (spring) dengan durasi 0.55s */
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
          /* Overshoot inertia effect pada derajat ke-3 */
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

function PlainLyrics({ lines }: { lines: string[] }) {
  return (
    <div className="widget-lyrics-plain-scroll">
      <div className="widget-lyrics-plain-note michie-text-secondary">
        Lirik tidak memiliki timestamp
      </div>
      {lines.map((line, i) => (
        <div key={i} className="widget-lyrics-plain-line michie-text-primary">
          {line}
        </div>
      ))}

      <style>{`
        .widget-lyrics-plain-scroll {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 1rem;
          scrollbar-width: none;
        }
        .widget-lyrics-plain-scroll::-webkit-scrollbar {
          display: none;
        }
        .widget-lyrics-plain-note {
          text-align: center;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.6;
          margin-bottom: 0.75rem;
        }
        .widget-lyrics-plain-line {
          text-align: center;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

function CandidatePicker({
  candidates,
  onPick,
}: {
  candidates: LyricsCandidate[];
  onPick: (candidate: LyricsCandidate) => void;
}) {
  return (
    <div className="widget-lyrics-picker">
      <div className="widget-lyrics-picker-title michie-text-secondary">Pilih lirik yang cocok</div>
      <div className="widget-lyrics-picker-list">
        {candidates.map((c) => (
          <button
            key={c.id}
            className="widget-lyrics-picker-item michie-box--secondary"
            onClick={() => onPick(c)}
          >
            <span className="widget-lyrics-picker-item-main michie-text-primary">
              {c.trackName ?? "Tanpa judul"} — {c.artistName ?? "Tanpa artis"}
            </span>
            <span className="widget-lyrics-picker-item-sub michie-text-secondary">
              {c.albumName ?? ""} · {Math.round(c.confidence)}%
            </span>
          </button>
        ))}
      </div>

      <style>{`
        .widget-lyrics-picker {
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
        }
        .widget-lyrics-picker-title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .widget-lyrics-picker-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .widget-lyrics-picker-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 0.6rem;
          font: inherit;
        }
        .widget-lyrics-picker-item-main {
          font-size: 0.85rem;
          font-weight: 600;
        }
        .widget-lyrics-picker-item-sub {
          font-size: 0.72rem;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}