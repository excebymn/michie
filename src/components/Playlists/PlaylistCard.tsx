import type { Playlists } from "../../globalValues";
import { IconMusicNote, IconHeart } from "./Icons";
import { toAssetUrl } from "../../utils/assetURL";

interface PlaylistCardProps {
  playlist: Playlists | "liked";
  onClick: () => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const isLiked = playlist === "liked";
  const name = isLiked ? "Liked Songs" : playlist.name;
  const cover = isLiked ? "" : playlist.image;
  const coverSrc = toAssetUrl(cover);

  return (
    <button className="pc-card" onClick={onClick}>
      <div className={`pc-cover michie-box ${isLiked ? "pc-cover--liked" : "michie-box--secondary"}`}>
        {isLiked ? (
          <IconHeart filled />
        ) : coverSrc ? (
          <img src={coverSrc} alt={name} className="pc-cover-img" />
        ) : (
          <IconMusicNote />
        )}
      </div>
      <div className="pc-name michie-text-secondary">{name}</div>

      <style>{`
        .pc-card { display: flex; flex-direction: column; gap: 8px; background: none; border: none; padding: 8px; cursor: pointer; text-align: left; width: 100%; }
        .pc-cover { width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .pc-cover svg { width: 32px; height: 32px; opacity: 0.6; }
        .pc-cover--liked svg { opacity: 1; }
        .pc-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .pc-name { font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </button>
  );
}