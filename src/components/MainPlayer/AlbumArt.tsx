// AlbumArt.tsx
// Menampilkan cover art dan info lagu (judul, artist, album).
// Membaca: currentSong dari playerStore.
import { useEffect, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";

export function AlbumArt() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const [artFailed, setArtFailed] = useState(false);

  // Reset flag error setiap kali cover berganti (lagu baru / cover baru),
  // supaya kegagalan load pada satu lagu tidak "nempel" ke lagu berikutnya.
  useEffect(() => {
    setArtFailed(false);
  }, [currentSong?.cover]);

  const showArt = !!currentSong?.cover && !artFailed;

  return (
    <>
      <div className="mpw-art michie-box michie-box--secondary">
        {showArt ? (
          <img
            key={currentSong.cover}
            src={`asset://localhost/${currentSong.cover}`}
            alt={currentSong.album ?? "Album art"}
            className="mpw-art-img"
            onError={() => setArtFailed(true)}
          />
        ) : (
          <div className="mpw-art-placeholder michie-text-primary">♪</div>
        )}
      </div>

      <div className="mpw-info">
        <p className="mpw-info-title michie-text-secondary">
          {currentSong?.name ?? "No song selected"}
        </p>
        <p className="mpw-info-sub michie-text-secondary">
          {currentSong?.artist ?? currentSong?.album_artist ?? "—"}
          {currentSong?.album ? ` · ${currentSong.album}` : ""}
        </p>
      </div>

      <style>{`
        .mpw-art {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
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