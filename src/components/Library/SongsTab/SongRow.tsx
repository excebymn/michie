import React, { useState, useRef, useEffect } from "react";
import { AlbumArt } from "../common/AlbumArt";
import { usePlayerStore } from "../../../stores/playerStore";
import { appService } from "../../../services/appService";
import { AddToPlaylistMenu } from "../../Playlists/AddToPlaylistMenu";
import type { SongsFull } from "../../../globalValues";

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

interface SongRowProps {
  song: SongsFull;
  onPlay: (song: SongsFull) => void;
}

const formatDuration = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(14, 19);

export const SongRow: React.FC<SongRowProps> = ({ song, onPlay }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickAway = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [menuOpen]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    appService.toggleFavorite(song.path);
  };

  const handlePlayNext = () => {
    playNext([song]);
    setMenuOpen(false);
  };

  const handleAddToQueue = () => {
    addToQueue([song]);
    setMenuOpen(false);
  };

  const handleOpenAddToPlaylist = () => {
    setShowAddToPlaylist(true);
    setMenuOpen(false);
  };

  return (
    <div
      className="michie-song-row"
      onDoubleClick={() => onPlay(song)}
      style={{
        display: "grid",
        gridTemplateColumns: "48px 2fr 1.3fr 1.3fr 60px 32px 32px",
        alignItems: "center",
        gap: 14,
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <AlbumArt path={song.cover} alt={song.album} size={44} rounded={8} />

      <div style={{ overflow: "hidden" }}>
        <div
          className="michie-text-secondary"
          style={{ fontSize: "0.92rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {song.name}
        </div>
        <div
          className="michie-text-secondary"
          style={{ fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {song.artist}
        </div>
      </div>

      <div className="michie-text-secondary" style={{ fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {song.album}
      </div>

      <div className="michie-text-secondary" style={{ fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {song.genre}
      </div>

      <div className="michie-text-secondary" style={{ fontSize: "0.85rem", textAlign: "right" }}>
        {formatDuration(song.duration)}
      </div>

      <button
        className="michie-text-secondary sr-icon-btn"
        onClick={handleToggleFavorite}
        title={song.favorited ? "Batal sukai" : "Sukai"}
        aria-label="Sukai lagu"
      >
        <IconHeart filled={!!song.favorited} />
      </button>

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          className="michie-text-secondary sr-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          title="Opsi lainnya"
          aria-label="Opsi lainnya"
        >
          <IconDots />
        </button>

        {menuOpen && (
          <div className="sr-menu michie-box michie-box--secondary" onClick={(e) => e.stopPropagation()}>
            <button className="sr-menu-item michie-text-secondary" onClick={() => { onPlay(song); setMenuOpen(false); }}>
              Putar Sekarang
            </button>
            <button className="sr-menu-item michie-text-secondary" onClick={handlePlayNext}>
              Putar Berikutnya
            </button>
            <button className="sr-menu-item michie-text-secondary" onClick={handleAddToQueue}>
              Tambah ke Antrian
            </button>
            <button className="sr-menu-item michie-text-secondary" onClick={handleOpenAddToPlaylist}>
              Tambah ke Playlist
            </button>
          </div>
        )}
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistMenu songs={[song]} onClose={() => setShowAddToPlaylist(false)} />
      )}

      <style>{`
        .sr-icon-btn {
          background: none;
          border: none;
          opacity: 0.4;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 8px;
        }
        .sr-icon-btn:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
        .sr-icon-btn svg { width: 16px; height: 16px; }
        .sr-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          min-width: 180px;
          padding: 6px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sr-menu-item {
          background: none;
          border: none;
          text-align: left;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.82rem;
        }
        .sr-menu-item:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
      `}</style>
    </div>
  );
};