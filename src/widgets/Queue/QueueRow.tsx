import { useState } from "react";
import type { Songs } from "../../globalValues";
import { IconGrip, IconRemove, IconPlayingBars } from "./Icons";

interface QueueRowProps {
  song: Songs;
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDragStartRow: () => void;
  onDropRow: () => void;
}

const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function QueueRow({
  song,
  index,
  isCurrent,
  onPlay,
  onRemove,
  onDragStartRow,
  onDropRow,
}: QueueRowProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`qr-row ${isCurrent ? "qr-row--current" : ""} ${isOver ? "qr-row--over" : ""}`}
      onClick={onPlay}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDropRow();
      }}
    >
      <span
        className="qr-grip michie-text-secondary"
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          onDragStartRow();
        }}
        onClick={(e) => e.stopPropagation()}
        title="Seret untuk mengatur ulang"
      >
        <IconGrip />
      </span>

      <span className="qr-index michie-text-secondary">
        {isCurrent ? <IconPlayingBars /> : index + 1}
      </span>

      <div className="qr-info">
        <div className="qr-title michie-text-secondary">{song.name}</div>
        <div className="qr-sub michie-text-secondary">
          {song.artist || song.album_artist || "—"}
        </div>
      </div>

      <span className="qr-duration michie-text-secondary">
        {formatDuration(song.duration)}
      </span>

      <button
        className="qr-remove michie-text-secondary"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={isCurrent}
        title={isCurrent ? "Lagu sedang diputar" : "Hapus dari antrian"}
        aria-label="Hapus dari antrian"
      >
        <IconRemove />
      </button>

      <style>{`
        .qr-row {
          display: grid;
          grid-template-columns: 20px 24px 1fr 48px 28px;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
        }
        .qr-row:hover { background: color-mix(in srgb, currentColor 6%, transparent); }
        .qr-row--current {
          font-weight: 600;
          background: color-mix(in srgb, currentColor 9%, transparent);
        }
        .qr-row--over { outline: 2px dashed currentColor; outline-offset: -2px; opacity: 0.85; }
        .qr-grip { opacity: 0.35; display: flex; cursor: grab; }
        .qr-grip svg { width: 14px; height: 14px; }
        .qr-index { font-size: 0.78rem; opacity: 0.5; text-align: center; display: flex; align-items: center; justify-content: center; }
        .qr-index svg { width: 14px; height: 14px; }
        .qr-info { overflow: hidden; }
        .qr-title { font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .qr-sub { font-size: 0.74rem; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .qr-duration { font-size: 0.76rem; opacity: 0.5; text-align: right; font-variant-numeric: tabular-nums; }
        .qr-remove {
          background: none; border: none; opacity: 0.4; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 4px; border-radius: 6px;
        }
        .qr-remove:hover:not(:disabled) { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
        .qr-remove:disabled { opacity: 0.15; cursor: default; }
        .qr-remove svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}
