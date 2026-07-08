import { useEffect, useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { playlistService } from "../../services/playlistService";
import { settingsService } from "../../services/settingsService";
import { appService } from "../../services/appService";
import { playerService } from "../../services/playerService";
import { useAppStore } from "../../stores/appStore";
import type { PlaylistFull, Songs, SongsFull } from "../../globalValues";
import { AddSongsPanel } from "./AddSongsPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  IconTrash,
  IconPencil,
  IconImage,
  IconShuffle,
  IconPlay,
  IconCheck,
  IconX,
  IconPlus,
  IconHeart,
} from "./Icons";

interface PlaylistDetailProps {
  playlistId: number | "liked";
  onBack: () => void;
}

const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function PlaylistDetail({ playlistId, onBack }: PlaylistDetailProps) {
  const isLiked = playlistId === "liked";
  const refreshPlaylists = useAppStore((s) => s.refreshPlaylists);

  const [playlist, setPlaylist] = useState<PlaylistFull | null>(null);
  const [likedSongs, setLikedSongs] = useState<SongsFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const songs: Songs[] = isLiked ? likedSongs : (playlist?.songs ?? []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isLiked) {
        const list = await appService.getLikedSongs();
        setLikedSongs(list);
      } else {
        const full = await playlistService.getPlaylist(playlistId as number);
        setPlaylist(full);
        setNameDraft(full.name);
      }
    } finally {
      setLoading(false);
    }
  }, [isLiked, playlistId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePlay = async (shuffled: boolean) => {
    if (isLiked) {
      await playerService.playSelection(likedSongs, shuffled);
    } else {
      await playerService.playPlaylist(playlistId as number, 0, shuffled);
    }
  };

  const handleRename = async () => {
    if (!playlist || !nameDraft.trim() || nameDraft === playlist.name) {
      setRenaming(false);
      return;
    }
    await playlistService.renamePlaylist(playlist.name, nameDraft.trim());
    setRenaming(false);
    await refreshPlaylists();
    await load();
  };

  const handleDelete = () => {
    if (!playlist) return;
    setConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (!playlist) return;
    await playlistService.deletePlaylist(playlist.name);
    await refreshPlaylists();
    setConfirmingDelete(false);
    onBack();
  };

  const handleRemoveSong = async (path: string) => {
    if (isLiked) {
      await appService.toggleFavorite(path);
      await load();
      return;
    }
    if (!playlist) return;
    const remaining = playlist.songs.filter((s) => s.path !== path);
    await playlistService.removeSongFromPlaylist(
      playlistId as number,
      path,
      remaining,
    );
    await load();
  };

  const handleUploadCover = async () => {
    if (!playlist) return;
    const selected = await open({
      multiple: false,
      filters: [{ name: "Gambar", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (!selected || typeof selected !== "string") return;
    await settingsService.addPlaylistCover(
      selected,
      playlist.name,
      playlistId as number,
    );
    await load();
  };

  if (loading) {
    return (
      <div className="pd-loading michie-text-secondary">
        Loading playlist...
      </div>
    );
  }

  return (
    <div className="pd-root">
      <button className="pd-back michie-text-secondary" onClick={onBack}>
        ← Back
      </button>

      <div className="pd-header">
        <div
          className={`pd-cover michie-box ${isLiked ? "pd-cover--liked" : "michie-box--secondary"}`}
          onClick={!isLiked ? handleUploadCover : undefined}
        >
          {isLiked ? (
            <IconHeart filled />
          ) : playlist?.image ? (
            <img
              src={`asset://localhost/${playlist.image}`}
              alt={playlist.name}
              className="pd-cover-img"
            />
          ) : (
            <IconImage />
          )}
        </div>

        <div className="pd-meta">
          {renaming ? (
            <div className="pd-rename">
              <input
                className="pd-rename-input michie-text-secondary"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
              <button
                className="pd-icon-btn michie-text-primary"
                onClick={handleRename}
                aria-label="save"
              >
                <IconCheck />
              </button>
              <button
                className="pd-icon-btn michie-text-primary"
                onClick={() => setRenaming(false)}
                aria-label="cancel"
              >
                <IconX />
              </button>
            </div>
          ) : (
            <div className="pd-title-row">
              <h2 className="pd-title michie-text-secondary">
                {isLiked ? "Liked Songs" : playlist?.name}
              </h2>
              {!isLiked && (
                <button
                  className="pd-icon-btn michie-text-secondary"
                  onClick={() => setRenaming(true)}
                  aria-label="Change name"
                >
                  <IconPencil />
                </button>
              )}
            </div>
          )}
          <p className="pd-count michie-text-secondary">
            {songs.length} Song(s)
          </p>

          <div className="pd-actions">
            <button
              className="pd-action michie-box michie-box--primary michie-text-secondary"
              onClick={() => handlePlay(false)}
              disabled={songs.length === 0}
            >
              <IconPlay />
              <span>Play</span>
            </button>
            <button
              className="pd-action michie-box michie-box--secondary michie-text-primary"
              onClick={() => handlePlay(true)}
              disabled={songs.length === 0}
            >
              <IconShuffle />
              <span>Shuffle</span>
            </button>
            {!isLiked && (
              <>
                <button
                  className="pd-action michie-box michie-box--secondary michie-text-primary"
                  onClick={() => setShowAddSongs(true)}
                >
                  <IconPlus />
                  <span>Add Song</span>
                </button>
                <button
                  className="pd-action pd-action--danger michie-box michie-box--secondary michie-text-primary"
                  onClick={handleDelete}
                >
                  <div className="michie-text-primary">delete</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showAddSongs && !isLiked && playlist && (
        <div className="pd-overlay">
          <AddSongsPanel
            playlistId={playlistId as number}
            existingPaths={playlist.songs.map((s) => s.path)}
            onClose={() => setShowAddSongs(false)}
            onAdded={load}
          />
        </div>
      )}

      <div className="pd-list">
        {songs.length === 0 ? (
          <div className="pd-empty michie-text-secondary">
            add some songs first, darling
          </div>
        ) : (
          songs.map((song, index) => (
            <div key={`${song.path}-${index}`} className="pd-row">
              <span className="pd-row-index michie-text-secondary">
                {index + 1}
              </span>
              <div className="pd-row-info">
                <span className="pd-row-title michie-text-secondary">
                  {song.name}
                </span>
                <span className="pd-row-sub michie-text-secondary">
                  {song.artist}
                </span>
              </div>
              <span className="pd-row-duration michie-text-secondary">
                {formatDuration(song.duration)}
              </span>
              <button
                className="pd-row-remove michie-text-secondary"
                onClick={() => handleRemoveSong(song.path)}
                aria-label="Delete Song"
              >
                <IconX />
              </button>
            </div>
          ))
        )}
        {confirmingDelete && playlist && (
          <ConfirmDialog
            title="do you wanna delete this playlist?"
            message={`are you really sure wanna delete this playlist "${playlist.name}"? this action have a consequences.`}
            confirmLabel="delete"
            danger
            onConfirm={confirmDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
      </div>

      <style>{`
  .pd-root {
    display: flex;
    flex-direction: column;
    gap: 18px;
    height: 100%;
    overflow: hidden;
  }

  .pd-back {
    align-self: flex-start;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    opacity: .6;
    font-size: .85rem;
  }

  .pd-back:hover {
    opacity: 1;
  }

  .pd-loading,
  .pd-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    opacity: .6;
  }

  .pd-header {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .pd-cover {
    width: 120px;
    aspect-ratio: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
  }

  .pd-cover svg {
    width: 36px;
    height: 36px;
    opacity: .6;
  }

  .pd-cover--liked svg {
    opacity: 1;
  }

  .pd-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pd-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pd-title-row,
  .pd-rename {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pd-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .pd-count {
    margin: 0;
    opacity: .55;
    font-size: .8rem;
  }

  .pd-rename-input {
    flex: 1;
    background: none;
    border: none;
    border-bottom: 2px solid currentColor;
    outline: none;
    padding: 2px 0;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .pd-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    opacity: .6;
  }

  .pd-icon-btn:hover {
    opacity: 1;
  }

  .pd-icon-btn svg {
    width: 15px;
    height: 15px;
  }

  .pd-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .pd-action {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: .82rem;
    font-weight: 600;
  }

  .pd-action svg {
    width: 14px;
    height: 14px;
  }

  .pd-action:disabled {
    opacity: .4;
    cursor: default;
  }

  .pd-action--danger {
    opacity: .75;
  }

  .pd-action--danger:hover {
    opacity: 1;
  }

  .pd-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pd-row {
    display: grid;
    grid-template-columns: 32px minmax(0,1fr) 56px 32px;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
  }

  .pd-row:hover {
    background: color-mix(in srgb, currentColor 6%, transparent);
  }

  .pd-row-index {
    text-align: center;
    opacity: .5;
    font-size: .8rem;
  }

  .pd-row-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .pd-row-title,
  .pd-row-sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pd-row-title {
    font-size: .87rem;
  }

  .pd-row-sub {
    font-size: .74rem;
    opacity: .55;
  }

  .pd-row-duration {
    text-align: right;
    opacity: .55;
    font-size: .78rem;
    font-variant-numeric: tabular-nums;
  }

  .pd-row-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    opacity: .35;
  }

  .pd-row-remove:hover {
    opacity: 1;
    background: color-mix(in srgb, red 15%, transparent);
  }

  .pd-row-remove svg {
    width: 13px;
    height: 13px;
  }
`}</style>
    </div>
  );
}
