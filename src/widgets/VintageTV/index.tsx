// src/widgets/VintageTV/index.tsx
import { usePlayerStore } from "../../stores/playerStore";
import "./vintagetv.css";

export default function VintageTV() {
  // Hanya ambil data lagu aktif dari Zustand store Michie
  const currentSong = usePlayerStore((s) => s.currentSong);

  // Menggunakan konvensi Tauri asset URL untuk memuat file lokal
  const coverUrl = currentSong?.cover
    ? `asset://localhost/${currentSong.cover}`
    : null;

  return (
    <div className="michie-box tv-widget">
      <div className="tv-screen">
        {/* Lapisan efek gangguan vintage */}
        <div className={`tv-static ${!coverUrl ? "tv-off-static" : ""}`} />
        <div className="tv-scanlines" />
        <div className="tv-flicker" />

        {/* Konten Gambar Album / Sinyal Rusak */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={currentSong?.name ?? "TV Display"}
            className="tv-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
            <div 
              className="text-sm font-mono tracking-widest text-zinc-500 uppercase"
              style={{ animation: "crtFlicker 0.2s infinite" }}
            >
              [ NO SIGNAL ]
            </div>
            <div className="text-xs font-mono text-zinc-600 mt-1">
              play a song to 
            </div>
          </div>
        )}
      </div>
    </div>
  );
}