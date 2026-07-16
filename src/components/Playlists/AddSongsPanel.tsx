import { useState, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { playlistService } from "../../services/playlistService";
import { normalizeForSearch } from "../../utils/normalize";
import type { SongsFull } from "../../globalValues";
import { IconCheck, IconX } from "./Icons";

interface AddSongsPanelProps {
  playlistId: number;
  existingPaths: string[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddSongsPanel({ playlistId, existingPaths, onClose, onAdded }: AddSongsPanelProps) {
  const songList = useAppStore((s) => s.songList);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const available = useMemo(
    () => songList.filter((s) => !existingPaths.includes(s.path)),
    [songList, existingPaths],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return available;
    const q = normalizeForSearch(query);
    return available.filter(
      (s) => normalizeForSearch(s.name).includes(q) || normalizeForSearch(s.artist).includes(q),
    );
  }, [available, query]);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    try {
      const songsToAdd: SongsFull[] = available.filter((s) => selected.has(s.path));
      await playlistService.addToPlaylist(songsToAdd, playlistId);
      onAdded();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="asp-root michie-box michie-box--secondary">
      <div className="asp-header">
        <input
          className="asp-search michie-text-primary"
          placeholder="Search for a song to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="asp-close michie-text-primary" onClick={onClose} aria-label="close">
          <IconX />
        </button>
      </div>

      <div className="asp-list">
        {filtered.length === 0 ? (
          <div className="asp-empty michie-text-secondary">no songs found</div>
        ) : (
          filtered.map((song) => {
            const isSelected = selected.has(song.path);
            return (
              <button key={song.path} className={`asp-row ${isSelected ? "asp-row--selected" : ""}`} onClick={() => toggle(song.path)}>
                <span className={`asp-check ${isSelected ? "asp-check--on michie-box michie-box--primary" : "michie-box michie-box--secondary"}`}>
                  {isSelected && <IconCheck />}
                </span>
                <span className="asp-row-info">
                  <span className="asp-row-title michie-text-primary">{song.name}</span>
                  <span className="asp-row-sub michie-text-primary">{song.artist}</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <button className="asp-submit michie-box--primary michie-text-secondary" onClick={handleAdd} disabled={selected.size === 0 || busy}>
        {busy ? "Adding..." : `Add (${selected.size})`}
      </button>

      <style>{`
        .asp-root { display: flex; flex-direction: column; gap: 10px; padding: 14px; max-height: 320px; }
        .asp-header { display: flex; align-items: center; gap: 8px; }
        .asp-search { flex: 1; background: none; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); border-radius: 8px; padding: 8px 10px; font-size: 0.85rem; outline: none; }
        .asp-close { background: none; border: none; cursor: pointer; opacity: 0.6; display: flex; }
        .asp-close svg { width: 14px; height: 14px; }
        .asp-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; min-height: 120px; }
        .asp-empty { padding: 20px; text-align: center; opacity: 0.5; font-size: 0.85rem; }
        .asp-row { display: flex; align-items: center; gap: 10px; background: none; border: none; padding: 7px 8px; border-radius: 8px; cursor: pointer; text-align: left; }
        .asp-row:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
        .asp-check { width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .asp-check svg { width: 12px; height: 12px; }
        .asp-row-info { display: flex; flex-direction: column; overflow: hidden; }
        .asp-row-title { font-size: 0.83rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .asp-row-sub { font-size: 0.72rem; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .asp-submit { border: none; padding: 10px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .asp-submit:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
}