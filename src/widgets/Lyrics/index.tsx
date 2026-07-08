import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { lyricsService } from "../../services/lyricsService";
import { parseLrc, type LrcLine } from "./parseLrc";
import type { LyricsCandidate, LyricsLookupResult } from "../../types/lyrics";

const ROW_HEIGHT = 2.75; // rem — tinggi tetap tiap baris, jaga layout gak pernah loncat

type LyricsPhase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "selecting"; candidates: LyricsCandidate[] }
  | { kind: "synced"; lines: LrcLine[] }
  | { kind: "plain"; text: string };

export function LyricsWidget() {
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
        if (requestIdRef.current !== requestId) return; // lagu sudah berganti lagi sebelum respons datang
        applyResult(result);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setPhase({ kind: "empty" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setPhase({ kind: "plain", text: plain.split(/\r?\n/)[0] ?? plain });
      return;
    }
    setPhase({ kind: "empty" });
  }

  async function pickCandidate(candidate: LyricsCandidate) {
    if (!currentSong?.path) return;
    // Simpan pilihan user ke cache supaya lagu ini tidak perlu dicari lagi
    await lyricsService.updateRemoteLyrics(
      currentSong.path,
      candidate.syncedLyrics ?? "",
      candidate.plainLyrics ?? "",
      candidate.id,
    );
    applyLyrics(candidate.syncedLyrics, candidate.plainLyrics);
  }

  return (
    <div className="widget-lyrics">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Memuat lirik...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lirik tidak ditemukan</div>
      )}

      {phase.kind === "plain" && (
        <div className="widget-lyrics-viewport">
          <div className="widget-lyrics-line widget-lyrics-line--active michie-text-primary">
            {phase.text}
          </div>
          <div className="widget-lyrics-line widget-lyrics-line--next michie-text-secondary">
            Lirik tidak memiliki timestamp
          </div>
        </div>
      )}

      {phase.kind === "synced" && <SyncedLyrics lines={phase.lines} progress={songProgress} />}

      {phase.kind === "selecting" && (
        <CandidatePicker candidates={phase.candidates} onPick={pickCandidate} />
      )}

      <style>{`
        .widget-lyrics {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
        }

        .widget-lyrics-status {
          font-size: 0.95rem;
          opacity: 0.7;
          text-align: center;
        }

        .widget-lyrics-viewport {
          width: 100%;
          height: ${ROW_HEIGHT * 2}rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .widget-lyrics-track {
          width: 100%;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .widget-lyrics-line {
          height: ${ROW_HEIGHT}rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 0.35s ease, opacity 0.35s ease, font-size 0.35s ease;
        }

        .widget-lyrics-line--active {
          font-size: 1.15rem;
          font-weight: 700;
          opacity: 1;
        }

        .widget-lyrics-line--next {
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
}

function SyncedLyrics({ lines, progress }: { lines: LrcLine[]; progress: number }) {
  // Tambah placeholder di awal & akhir supaya index track selalu valid
  // untuk state "belum mulai" dan "sudah selesai" tanpa logika khusus.
  const rows = [{ time: -Infinity, text: "\u266A" }, ...lines, { time: Infinity, text: "\u266A" }];

  let activeRow = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].time <= progress) activeRow = i;
    else break;
  }
  const nextRow = Math.min(activeRow + 1, rows.length - 1);

  return (
    <div className="widget-lyrics-viewport">
      <div
        className="widget-lyrics-track"
        style={{ transform: `translateY(-${activeRow * ROW_HEIGHT}rem)` }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            className={
              i === activeRow
                ? "widget-lyrics-line widget-lyrics-line--active michie-text-primary"
                : i === nextRow
                ? "widget-lyrics-line widget-lyrics-line--next michie-text-secondary"
                : "widget-lyrics-line michie-text-secondary"
            }
          >
            {row.text || "\u00A0"}
          </div>
        ))}
      </div>
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