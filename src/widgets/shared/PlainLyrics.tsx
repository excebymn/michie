// Lirik tanpa timestamp — ditampilin utuh sebagai teks statis (semua baris),
// dengan catatan kecil di atas biar jelas kenapa gak ada highlight yang jalan.
export function PlainLyrics({ lines }: { lines: string[] }) {
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