// SourcePicker.tsx
// Bottom sheet untuk memilih sumber musik: Songs, Albums, Artists, Genres, Playlists, Folder.
// Membaca : songList, albumList, artistList, genreList, playlistList, directories,
//           isScanning dari appStore
// Memanggil: playerService (play*), settingsService (addDirectory, removeDirectory, scanDirectory),
//            appService (onScanFinished), appStore (refreshDirectories, refreshLibrary, setScanning)

import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../../stores/appStore";
import { playerService } from "../../services/playerService";
import { settingsService } from "../../services/settingsService";
import { appService } from "../../services/appService";
import { IconFolder, IconFolderAdd, IconScan, IconTrash } from "./Icons";

type SourceType = "songs" | "albums" | "artists" | "genres" | "playlists" | "folder";

interface SourcePickerProps {
  onClose: () => void;
}

const TABS: { key: SourceType; label: string }[] = [
  { key: "songs",     label: "Songs" },
  { key: "albums",    label: "Albums" },
  { key: "artists",   label: "Artists" },
  { key: "genres",    label: "Genres" },
  { key: "playlists", label: "Playlists" },
  { key: "folder",    label: "Folder" },
];

export function SourcePicker({ onClose }: SourcePickerProps) {
  const [activeTab, setActiveTab] = useState<SourceType>("songs");
  const [scanDone, setScanDone] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);

  const {
    songList, albumList, artistList, genreList, playlistList,
    directories, isScanning,
    refreshDirectories, refreshLibrary, setScanning,
  } = useAppStore();

  // muat daftar folder saat tab folder dibuka
  useEffect(() => {
    if (activeTab === "folder") refreshDirectories();
  }, [activeTab]);

  // setelah scan selesai dan flagged untuk play, jalankan playSelection
  useEffect(() => {
    if (!scanDone || !pendingPlay) return;
    setScanDone(false);
    setPendingPlay(false);
    (async () => {
      await refreshLibrary();
      const fresh = useAppStore.getState().songList;
      if (fresh.length > 0) {
        await playerService.playSelection(fresh);
        onClose();
      }
    })();
  }, [scanDone, pendingPlay]);

  // ── folder handlers ──────────────────────────────────────────────────────────

  const handleAddFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== "string") return;
    await settingsService.addDirectory(selected);
    await refreshDirectories();
  };

  const handleScanAndPlay = async () => {
    const ongoing = await settingsService.checkForOngoingScan();
    if (ongoing) return;

    setPendingPlay(true);
    setScanning(true);

    const unlisten = await appService.onScanFinished(async () => {
      setScanning(false);
      setScanDone(true);
      unlisten();
    });

    await settingsService.scanDirectory();
  };

  const handleRemoveFolder = async (dir: string) => {
    await settingsService.removeDirectory(dir);
    await refreshDirectories();
  };

  // ── library handlers ─────────────────────────────────────────────────────────

  const handlePickSong = async (index: number) => {
    await playerService.playSelection(songList.slice(index));
    onClose();
  };
  const handlePickAlbum = async (albumName: string) => {
    await playerService.playAlbum(albumName, 0, false);
    onClose();
  };
  const handlePickArtist = async (artist: string) => {
    await playerService.playArtist(artist, false);
    onClose();
  };
  const handlePickGenre = async (genre: string) => {
    await playerService.playGenre(genre, false);
    onClose();
  };
  const handlePickPlaylist = async (id: number) => {
    await playerService.playPlaylist(id, 0, false);
    onClose();
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="mpw-source-overlay" onClick={onClose}>
        <div className="mpw-source-panel" onClick={(e) => e.stopPropagation()}>

          <div className="mpw-source-header">
            <span className="mpw-source-title">Play from</span>
            <button className="mpw-source-close" onClick={onClose}>✕</button>
          </div>

          <div className="mpw-source-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`mpw-source-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mpw-source-list">
            {/* songs */}
            {activeTab === "songs" && songList.map((s, i) => (
              <button key={s.path} className="mpw-source-item" onClick={() => handlePickSong(i)}>
                <span className="mpw-source-item-primary">{s.name}</span>
                <span className="mpw-source-item-secondary">{s.artist ?? "Unknown"}</span>
              </button>
            ))}

            {/* albums */}
            {activeTab === "albums" && albumList.map((a) => (
              <button key={a.album} className="mpw-source-item" onClick={() => handlePickAlbum(a.album)}>
                <span className="mpw-source-item-primary">{a.album}</span>
                <span className="mpw-source-item-secondary">{a.album_artist ?? "Unknown"}</span>
              </button>
            ))}

            {/* artists */}
            {activeTab === "artists" && artistList.map((a) => (
              <button key={a.album_artist} className="mpw-source-item" onClick={() => handlePickArtist(a.album_artist)}>
                <span className="mpw-source-item-primary">{a.album_artist}</span>
              </button>
            ))}

            {/* genres */}
            {activeTab === "genres" && genreList.map((g) => (
              <button key={g.genre} className="mpw-source-item" onClick={() => handlePickGenre(g.genre)}>
                <span className="mpw-source-item-primary">{g.genre}</span>
              </button>
            ))}

            {/* playlists */}
            {activeTab === "playlists" && playlistList.map((p) => (
              <button key={p.id} className="mpw-source-item" onClick={() => handlePickPlaylist(p.id)}>
                <span className="mpw-source-item-primary">{p.name}</span>
              </button>
            ))}

            {/* folder */}
            {activeTab === "folder" && (
              <div className="mpw-folder-tab">
                <div className="mpw-folder-actions">
                  <button className="mpw-folder-btn" onClick={handleAddFolder}>
                    <IconFolderAdd />
                    <span>Add folder</span>
                  </button>
                  <button
                    className={`mpw-folder-btn mpw-folder-btn-scan ${isScanning ? "scanning" : ""}`}
                    onClick={handleScanAndPlay}
                    disabled={isScanning}
                  >
                    <IconScan />
                    <span>{isScanning ? "Scanning…" : "Scan & play"}</span>
                  </button>
                </div>

                {directories.length === 0 ? (
                  <div className="mpw-folder-empty">
                    <IconFolderAdd />
                    <p>No folders added yet.</p>
                    <p>Click "Add folder" to get started.</p>
                  </div>
                ) : (
                  directories.map((d) => (
                    <div key={d.dir_path} className="mpw-folder-item">
                      <IconFolder />
                      <span className="mpw-folder-path">{d.dir_path}</span>
                      <button
                        className="mpw-folder-remove"
                        onClick={() => handleRemoveFolder(d.dir_path)}
                        title="Remove folder"
                        aria-label="Remove folder"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mpw-source-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 999;
          backdrop-filter: blur(4px);
        }
        .mpw-source-panel {
          background: canvas;
          color: canvastext;
          width: 100%;
          max-width: 480px;
          max-height: 70vh;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .mpw-source-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid color-mix(in srgb, canvastext 10%, transparent);
        }
        .mpw-source-title { font-weight: 600; font-size: 0.95rem; }
        .mpw-source-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.5;
          color: inherit;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .mpw-source-close:hover { opacity: 1; }

        .mpw-source-tabs {
          display: flex;
          overflow-x: auto;
          padding: 0 12px;
          border-bottom: 1px solid color-mix(in srgb, canvastext 10%, transparent);
        }
        .mpw-source-tab {
          background: none;
          border: none;
          padding: 10px 12px;
          cursor: pointer;
          font-size: 0.8rem;
          color: inherit;
          opacity: 0.5;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .mpw-source-tab.active { opacity: 1; border-bottom-color: currentColor; }
        .mpw-source-tab:hover { opacity: 0.8; }

        .mpw-source-list {
          flex: 1;
          overflow-y: auto;
          padding: 6px 0 24px;
        }
        .mpw-source-item {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 9px 16px;
          cursor: pointer;
          color: inherit;
          text-align: left;
          transition: background 0.1s;
        }
        .mpw-source-item:hover {
          background: color-mix(in srgb, canvastext 6%, transparent);
        }
        .mpw-source-item-primary {
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .mpw-source-item-secondary {
          font-size: 0.75rem;
          opacity: 0.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        /* ── folder tab ── */
        .mpw-folder-tab { display: flex; flex-direction: column; }
        .mpw-folder-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid color-mix(in srgb, canvastext 8%, transparent);
        }
        .mpw-folder-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: color-mix(in srgb, canvastext 8%, transparent);
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          color: inherit;
          font-size: 0.8rem;
          font-weight: 500;
          transition: background 0.15s, opacity 0.15s;
        }
        .mpw-folder-btn:hover {
          background: color-mix(in srgb, canvastext 14%, transparent);
        }
        .mpw-folder-btn:disabled { opacity: 0.4; cursor: default; }
        .mpw-folder-btn-scan {
          background: color-mix(in srgb, currentColor 15%, transparent);
        }
        .mpw-folder-btn-scan:hover:not(:disabled) {
          background: color-mix(in srgb, currentColor 24%, transparent);
        }
        .mpw-folder-btn-scan.scanning svg {
          animation: mpw-spin 1s linear infinite;
        }
        @keyframes mpw-spin { to { transform: rotate(360deg); } }

        .mpw-folder-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 40px 16px;
          opacity: 0.4;
          text-align: center;
        }
        .mpw-folder-empty svg { opacity: 0.5; width: 32px; height: 32px; }
        .mpw-folder-empty p { margin: 0; font-size: 0.82rem; }

        .mpw-folder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-bottom: 1px solid color-mix(in srgb, canvastext 5%, transparent);
        }
        .mpw-folder-item svg { flex-shrink: 0; opacity: 0.5; }
        .mpw-folder-path {
          flex: 1;
          font-size: 0.82rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          opacity: 0.85;
          font-family: monospace;
        }
        .mpw-folder-remove {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.35;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: opacity 0.15s, background 0.15s;
        }
        .mpw-folder-remove:hover {
          opacity: 0.9;
          background: color-mix(in srgb, red 15%, transparent);
        }
      `}</style>
    </>
  );
}