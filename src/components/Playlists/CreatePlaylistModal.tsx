import { useState } from "react";
import { playlistService } from "../../services/playlistService";
import { useAppStore } from "../../stores/appStore";
import { IconX, IconCheck } from "./Icons";

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreated?: (name: string) => void;
}

export function CreatePlaylistModal({ onClose, onCreated }: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const refreshPlaylists = useAppStore((s) => s.refreshPlaylists);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await playlistService.createPlaylist(trimmed, [], false);
      await playlistService.emitPlaylistAdded();
      await refreshPlaylists();
      onCreated?.(trimmed);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-panel michie-box michie-box--secondary" onClick={(e) => e.stopPropagation()}>
        <div className="cpm-header">
          <span className="cpm-title michie-text-primary">New playlist</span>
          <button className="cpm-close michie-text-secondary" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>

        <input
          className="cpm-input michie-text-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <button className="cpm-submit michie-box michie-box--primary michie-text-secondary" onClick={handleCreate} disabled={!name.trim() || busy}>
          <IconCheck />
          <span>{busy ? "Creating..." : "Create Playlist"}</span>
        </button>
      </div>

      <style>{`
        .cpm-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .cpm-panel { width: 320px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .cpm-header { display: flex; align-items: center; justify-content: space-between; }
        .cpm-title { font-size: 1rem; font-weight: 600; }
        .cpm-close { background: none; border: none; cursor: pointer; opacity: 0.6; display: flex; }
        .cpm-close svg { width: 16px; height: 16px; }
        .cpm-input { background: none; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); border-radius: 10px; padding: 10px 12px; font-size: 0.9rem; outline: none; }
        .cpm-submit { border: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 0.88rem; font-weight: 600; }
        .cpm-submit:disabled { opacity: 0.4; cursor: default; }
        .cpm-submit svg { width: 15px; height: 15px; }
      `}</style>
    </div>
  );
}