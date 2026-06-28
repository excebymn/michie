// AlbumArt.tsx
// Menampilkan cover art dan info lagu (judul, artist, album).
// Membaca: currentSong dari playerStore.

import { usePlayerStore } from "../../stores/playerStore";

export function AlbumArt() {
  const currentSong = usePlayerStore((s) => s.currentSong);

  return (
    <>
      <div className="mpw-art">
        {currentSong?.cover ? (
          <img
            src={`asset://localhost/${currentSong.cover}`}
            alt={currentSong.album ?? "Album art"}
            className="mpw-art-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="mpw-art-placeholder">♪</div>
        )}
      </div>

      <div className="mpw-info">
        <p className="mpw-info-title">{currentSong?.name ?? "No song selected"}</p>
        <p className="mpw-info-sub">
          {currentSong?.artist ?? currentSong?.album_artist ?? "—"}
          {currentSong?.album ? ` · ${currentSong.album}` : ""}
        </p>
      </div>

      <style>{`
        .mpw-art {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: color-mix(in srgb, currentColor 8%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mpw-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mpw-art-placeholder {
          font-size: 48px;
          opacity: 0.2;
          user-select: none;
        }
        .mpw-info { text-align: center; }
        .mpw-info-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mpw-info-sub {
          margin: 3px 0 0;
          font-size: 0.78rem;
          opacity: 0.55;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </>
  );
}