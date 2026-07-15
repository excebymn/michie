import { ListMusic } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";

// Widget kedua — masih cuma pakai class michie-* buat semua warna
// (michie-box/michie-circle buat permukaan, michie-text-primary/secondary
// buat warna teks & icon). Nggak ada warna custom di-hardcode di sini.
// Cek: sesuaikan nama field `queue`/`currentIndex` kalau beda di
// playerStore.ts asli kamu.
export function StatsWidget() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const total = queue?.length ?? 0;
  const position =
    typeof currentIndex === "number" && total > 0 ? currentIndex + 1 : 0;
  const progress = total > 0 ? (position / total) * 100 : 0;

  return (
    <div className="widget-stats">
      <div className="widget-stats-icon michie-circle michie-circle--primary">
        <ListMusic size={14} className="michie-text-secondary" />
      </div>

      <div className="widget-stats-main">
        <span className="widget-stats-value michie-text-secondary">
          {position}
          <span className="widget-stats-value-total michie-text-secondary">
            /{total}
          </span>
        </span>
        <span className="widget-stats-label michie-text-secondary">
          in queue
        </span>
      </div>

      <div className="widget-stats-track michie-box michie-box--secondary">
        <div
          className="widget-stats-fill michie-box michie-box--primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        .widget-stats {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          padding: 14px 12px;
        }

        .widget-stats-icon {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .widget-stats-main {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .widget-stats-value {
          display: flex;
          align-items: baseline;
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.1;
        }

        .widget-stats-value-total {
          font-size: 1rem;
          font-weight: 500;
          margin-left: 2px;
          opacity: 0.7;
        }

        .widget-stats-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.7;
        }

        /* michie-box punya border-radius besar bawaan tema; di elemen
           setinggi 6px ini otomatis ke-clamp jadi bentuk pill. */
        .widget-stats-track {
          position: relative;
          width: 70%;
          height: 6px;
          overflow: hidden;
          margin-top: 6px;
        }

        .widget-stats-fill {
          position: absolute;
          inset: 0;
          right: auto;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}