import type { LyricsCandidate } from "../../types/lyrics";

export function CandidatePicker({
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