import { usePlayerStore } from "../../stores/playerStore";
import { appService } from "../../services/appService";
import { IconHeart, IconShuffle, IconRepeat } from "./Icons";
import { AlbumArt } from "../Library/common/AlbumArt";

export function QueueControls() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setShuffleMode = usePlayerStore((s) => s.setShuffleMode);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);

  const cycleRepeat = () => setRepeatMode((repeatMode + 1) % 3);

  const handleToggleFavorite = () => {
    if (!currentSong) return;
    appService.toggleFavorite(currentSong.path);
  };

  return (
    <div className="qc-root michie-box michie-box--secondary">
      <div className="qc-now">
        <AlbumArt
          path={currentSong?.cover ?? ""}
          alt={currentSong?.album ?? ""}
          size={44}
          rounded={8}
        />
        <div className="qc-now-info">
          <div className="qc-now-title michie-text-primary">
            {currentSong?.name ?? "No songs"}
          </div>
          <div className="qc-now-sub michie-text-primary">
            {currentSong?.artist ?? currentSong?.album_artist ?? "—"}
          </div>
        </div>
      </div>

      <div className="qc-actions">
        <button
          className={`qc-btn michie-text-primary ${currentSong?.favorited ? "active" : ""}`}
          onClick={handleToggleFavorite}
          disabled={!currentSong}
          title="like"
          aria-label="Like this song"
        >
          <IconHeart filled={!!currentSong?.favorited} />
        </button>
        <button
          className={`qc-btn michie-text-primary ${isShuffle ? "active" : ""}`}
          onClick={setShuffleMode}
          title="Shuffle"
          aria-label="shuffle this queue"
        >
          <IconShuffle />
        </button>
        <button
          className={`qc-btn michie-text-primary ${repeatMode > 0 ? "active" : ""}`}
          onClick={cycleRepeat}
          title={["Don't repeat", "Repeat all", "Repeat this one"][repeatMode]}
          aria-label="Repeat"
        >
          <IconRepeat />
          {repeatMode === 2 && <span className="qc-badge">1</span>}
        </button>
      </div>

      <style>{`
        .qc-root { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; }
        .qc-now { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .qc-now-info { min-width: 0; }
        .qc-now-title { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .qc-now-sub { font-size: 0.74rem; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .qc-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .qc-btn { position: relative; background: none; border: none; padding: 8px; border-radius: 8px; cursor: pointer; opacity: 0.5; display: flex; align-items: center; justify-content: center; }
        .qc-btn svg { width: 18px; height: 18px; }
        .qc-btn:hover { opacity: 0.9; background: color-mix(in srgb, currentColor 10%, transparent); }
        .qc-btn.active { opacity: 1; }
        .qc-btn:disabled { opacity: 0.2; cursor: default; }
        .qc-badge { position: absolute; top: 2px; right: 2px; font-size: 9px; font-weight: 700; }
      `}</style>
    </div>
  );
}
