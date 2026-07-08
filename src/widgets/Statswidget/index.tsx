import { usePlayerStore } from "../../stores/playerStore";

// Contoh widget pluggable kedua — sekaligus nunjukkin widget boleh baca
// store lain (playerStore) selama tetap cuma pakai class michie-* buat warna.
// Cek: sesuaikan nama field `queue`/`currentIndex` kalau ternyata beda di
// playerStore.ts asli kamu.
export function StatsWidget() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const total = queue?.length ?? 0;
  const position =
    typeof currentIndex === "number" && total > 0 ? currentIndex + 1 : "-";

  return (
    <div className="widget-stats">
      <span className="widget-stats-value michie-text-secondary">{total}</span>
      <span className="widget-stats-label michie-text-secondary">
        songs in queue
      </span>
      <span className="widget-stats-sub michie-text-secondary">
        position: {position}
      </span>

      <style>{`
        .widget-stats {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }
        .widget-stats-value { font-size: 1.6rem; font-weight: 700; }
        .widget-stats-label { font-size: 0.72rem; opacity: 0.85; }
        .widget-stats-sub { font-size: 0.68rem; opacity: 0.6; }
      `}</style>
    </div>
  );
}