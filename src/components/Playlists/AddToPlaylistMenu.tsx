import { useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { appService } from "../../services/appService";
import { playlistService } from "../../services/playlistService";
import type { Songs } from "../../globalValues";
import { IconHeart, IconPlus, IconCheck, IconX } from "./Icons";

interface AddToPlaylistMenuProps {
  songs: Songs[];
  onClose: () => void;
}

export function AddToPlaylistMenu({ songs, onClose }: AddToPlaylistMenuProps) {
  const playlistList = useAppStore((s) => s.playlistList);
  const refreshPlaylists = useAppStore((s) => s.refreshPlaylists);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<number | "liked" | "new" | null>(null);

  const isLiked = songs.length === 1 && !!songs[0]?.favorited;

  const handleToggleLiked = async () => {
    setBusyId("liked");
    try {
      for (const s of songs) {
        await appService.toggleFavorite(s.path);
      }
      onClose();
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToExisting = async (playlistId: number) => {
    setBusyId(playlistId);
    try {
      await playlistService.addToPlaylist(songs, playlistId);
      onClose();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusyId("new");
    try {
      await playlistService.createPlaylist(trimmed, songs, true);
      await playlistService.emitPlaylistAdded();
      await refreshPlaylists();
      onClose();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="atp-overlay" onClick={onClose}>
      <div className="atp-panel michie-box michie-box--secondary" onClick={(e) => e.stopPropagation()}>
        <div className="atp-header">
          <span className="atp-title michie-text-secondary">Add to playlist</span>
          <button className="atp-close michie-text-secondary" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>

        <button className="atp-row" onClick={handleToggleLiked} disabled={busyId === "liked"}>
          <span className="atp-icon michie-text-secondary"><IconHeart filled={isLiked} /></span>
          <span className="atp-label michie-text-secondary">
            {songs.length === 1 && isLiked ? "Remove from liked songs" : "Liked songs"}
          </span>
        </button>

        <div className="atp-divider" />

        <div className="atp-list">
          {playlistList.length === 0 ? (
            <div className="atp-empty michie-text-secondary">No playlists yet.</div>
          ) : (
            playlistList.map((p) => (
              <button key={p.id} className="atp-row" onClick={() => handleAddToExisting(p.id)} disabled={busyId === p.id}>
                <span className="atp-icon michie-text-secondary"><IconPlus /></span>
                <span className="atp-label michie-text-secondary">{p.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="atp-divider" />

        {creating ? (
          <div className="atp-create">
            <input
              className="atp-input michie-text-secondary"
              placeholder="New playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
            />
            <button className="atp-confirm michie-box michie-box--primary michie-text-primary" onClick={handleCreateAndAdd} disabled={!newName.trim() || busyId === "new"}>
              <IconCheck />
            </button>
          </div>
        ) : (
          <button className="atp-row" onClick={() => setCreating(true)}>
            <span className="atp-icon michie-text-secondary"><IconPlus /></span>
            <span className="atp-label michie-text-secondary">New playlist</span>
          </button>
        )}
      </div>

      <style>{`
        .atp-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .atp-panel { width: 300px; max-height: 70vh; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
        .atp-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 6px; }
        .atp-title { font-size: 0.92rem; font-weight: 600; }
        .atp-close { background: none; border: none; cursor: pointer; opacity: 0.6; display: flex; }
        .atp-close svg { width: 14px; height: 14px; }
        .atp-divider { height: 1px; background: color-mix(in srgb, currentColor 12%, transparent); margin: 4px 0; }
        .atp-list { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
        .atp-empty { padding: 10px 8px; opacity: 0.5; font-size: 0.82rem; }
        .atp-row { display: flex; align-items: center; gap: 10px; background: none; border: none; padding: 9px 8px; border-radius: 8px; cursor: pointer; text-align: left; width: 100%; }
        .atp-row:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
        .atp-row:disabled { opacity: 0.5; cursor: default; }
        .atp-icon { display: flex; opacity: 0.7; }
        .atp-icon svg { width: 15px; height: 15px; }
        .atp-label { font-size: 0.85rem; }
        .atp-create { display: flex; gap: 6px; padding: 4px; }
        .atp-input { flex: 1; background: none; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); border-radius: 8px; padding: 8px 10px; font-size: 0.83rem; outline: none; }
        .atp-confirm { border: none; width: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .atp-confirm:disabled { opacity: 0.4; cursor: default; }
        .atp-confirm svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}