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

export function LyricsKaraokeWidget() {
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
    <div className="widget-lyrics-karaoke">
      {phase.kind === "loading" && (
        <div className="widget-lyrics-status michie-text-secondary">Memuat lirik...</div>
      )}

      {phase.kind === "empty" && (
        <div className="widget-lyrics-status michie-text-secondary">Lirik tidak ditemukan</div>
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

  // Mengitung persentase seberapa jauh suku kata/kata berjalan di dalam baris aktif saat ini
  let progressPercent = 0;
  if (currentLine) {
    const startTime = currentLine.time;
    // Durasi baris adalah jarak ke baris berikutnya, atau fallback 4 detik jika itu baris terakhir
    const endTime = nextLine ? nextLine.time : startTime + 4;
    const duration = endTime - startTime;
    if (duration > 0) {
      progressPercent = Math.min(100, Math.max(0, ((progress - startTime) / duration) * 100));
    }
  }

  return (
    <div className="karaoke-view" key={activeIndex}>
      {/* 1. BARIS AKTIF UTAMA (Efek Teks Terisi Berjalan) */}
      <div className="karaoke-row-active michie-box--secondary">
        {/* Lapisan Teks Dasar (Warna Redup) */}
        <div className="karaoke-text-base michie-text-secondary">
          {currentText || "\u00A0"}
        </div>
        {/* Lapisan Teks Karaoke (Warna Menyala menyapu dari kiri ke kanan via CSS width) */}
        <div 
          className="karaoke-text-fill michie-text-primary"
          style={{ width: `${progressPercent}%` }}
        >
          {currentText || "\u00A0"}
        </div>
      </div>

      {/* 2. BOCORAN BARIS BERIKUTNYA (Sangat samar di bawahnya agar user bersiap) */}
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
          opacity: 0.25; /* Teks dasar dibuat pudar */
        }

        .karaoke-text-fill {
          left: 0;
          text-align: left;
          padding-left: calc(50% - (100% - 3rem)/2); /* Auto center alignment trick */
          white-space: nowrap;
          /* Transisi pergeseran sapuan warna dibuat sangat tipis agar tidak tersendat */
          transition: width 0.15s linear; 
          border-right: 2px solid var(--color-primary); /* Kursor pengetikan */
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