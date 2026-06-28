import { useEffect, useRef, useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayerStore } from "../stores/playerStore";
import { useAppStore } from "../stores/appStore";
import { playerService } from "../services/playerService";
import { settingsService } from "../services/settingsService";
import { appService } from "../services/appService";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── icons (inline SVG, zero deps) ──────────────────────────────────────────

const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const IconPause = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="3" width="4" height="18" rx="1" />
    <rect x="15" y="3" width="4" height="18" rx="1" />
  </svg>
);

const IconPrev = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="19,3 5,12 19,21" />
    <rect x="4" y="3" width="2.5" height="18" rx="1" />
  </svg>
);

const IconNext = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
    <rect x="17.5" y="3" width="2.5" height="18" rx="1" />
  </svg>
);

const IconShuffle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const IconRepeat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconVolume = ({ muted }: { muted: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {muted ? (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    ) : (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </>
    )}
  </svg>
);

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconFolderAdd = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const IconScan = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─── source picker ───────────────────────────────────────────────────────────

type SourceType = "songs" | "albums" | "artists" | "genres" | "playlists" | "folder";

interface SourcePickerProps {
  onClose: () => void;
}

function SourcePicker({ onClose }: SourcePickerProps) {
  const [activeTab, setActiveTab] = useState<SourceType>("songs");
  const { songList, albumList, artistList, genreList, playlistList, directories, refreshDirectories, refreshLibrary, setScanning, isScanning } = useAppStore();
  const [scanDone, setScanDone] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);

  const tabs: { key: SourceType; label: string }[] = [
    { key: "songs", label: "Songs" },
    { key: "albums", label: "Albums" },
    { key: "artists", label: "Artists" },
    { key: "genres", label: "Genres" },
    { key: "playlists", label: "Playlists" },
    { key: "folder", label: "Folder" },
  ];

  // load directories ketika tab folder dibuka
  useEffect(() => {
    if (activeTab === "folder") refreshDirectories();
  }, [activeTab]);

  // setelah scan selesai dan user tadi minta play, langsung play semua lagu baru
  useEffect(() => {
    if (scanDone && pendingPlay) {
      setScanDone(false);
      setPendingPlay(false);
      (async () => {
        await refreshLibrary();
        const { songList: fresh } = useAppStore.getState();
        if (fresh.length > 0) {
          await playerService.playSelection(fresh);
          onClose();
        }
      })();
    }
  }, [scanDone, pendingPlay]);

  const handleAddFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== "string") return;

    await settingsService.addDirectory(selected);
    await refreshDirectories();
  };

  const handleScanAndPlay = async () => {
    const isOngoing = await settingsService.checkForOngoingScan();
    if (isOngoing) return;

    setPendingPlay(true);
    setScanning(true);

    // listen sekali untuk scan-finished
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

  return (
    <div className="mpw-source-overlay" onClick={onClose}>
      <div className="mpw-source-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mpw-source-header">
          <span className="mpw-source-title">Play from</span>
          <button className="mpw-source-close" onClick={onClose}>✕</button>
        </div>

        <div className="mpw-source-tabs">
          {tabs.map((t) => (
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
          {activeTab === "songs" &&
            songList.map((s, i) => (
              <button key={s.path} className="mpw-source-item" onClick={() => handlePickSong(i)}>
                <span className="mpw-source-item-primary">{s.name}</span>
                <span className="mpw-source-item-secondary">{s.artist ?? "Unknown"}</span>
              </button>
            ))}

          {activeTab === "albums" &&
            albumList.map((a) => (
              <button key={a.album} className="mpw-source-item" onClick={() => handlePickAlbum(a.album)}>
                <span className="mpw-source-item-primary">{a.album}</span>
                <span className="mpw-source-item-secondary">{a.album_artist ?? "Unknown"}</span>
              </button>
            ))}

          {activeTab === "artists" &&
            artistList.map((a) => (
              <button key={a.album_artist} className="mpw-source-item" onClick={() => handlePickArtist(a.album_artist)}>
                <span className="mpw-source-item-primary">{a.album_artist}</span>
              </button>
            ))}

          {activeTab === "genres" &&
            genreList.map((g) => (
              <button key={g.genre} className="mpw-source-item" onClick={() => handlePickGenre(g.genre)}>
                <span className="mpw-source-item-primary">{g.genre}</span>
              </button>
            ))}

          {activeTab === "playlists" &&
            playlistList.map((p) => (
              <button key={p.id} className="mpw-source-item" onClick={() => handlePickPlaylist(p.id)}>
                <span className="mpw-source-item-primary">{p.name}</span>
              </button>
            ))}

          {activeTab === "folder" && (
            <div className="mpw-folder-tab">
              {/* action buttons */}
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

              {/* daftar folder */}
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
  );
}

// ─── main widget ─────────────────────────────────────────────────────────────

export function MusicPlayerWidget() {
  const {
    currentSong,
    isPlaying,
    isLoaded,
    isShuffle,
    repeatMode,
    volume,
    songProgress,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    setRepeatMode,
    setShuffleMode,
    setSongProgress,
    setIsPlaying,
    setCurrentSong,
    loadPlayerState,
    stop,
    updateSongDetails,
  } = usePlayerStore();

  const [duration, setDuration] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  // scrubValue: nilai lokal saat user drag slider — mencegah polling overwrite posisi
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const isDragging = useRef(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlisteners = useRef<Array<() => void>>([]);

  // ── init on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadPlayerState();

    const setup = async () => {
      const ul1 = await playerService.onCurrentSong((e) => {
        const song = (e.payload as { q: any }).q;
        setCurrentSong(song);
        setDuration(song?.duration ?? 0);
      });

      const ul2 = await playerService.onControlsPlayPause((e) => {
        setIsPlaying(e.payload as unknown as boolean);
      });

      const ul3 = await playerService.onQueueCleared(() => {
        stop();
        setDuration(0);
      });

      const ul4 = await playerService.onUpdateSong(async (e) => {
        const { dir_path } = e.payload as { dir_path: string };
        await updateSongDetails(dir_path);
      });

      const ul5 = await playerService.onShuffleMode(() => {
        // handled by store already via setShuffleModeState
      });

      unlisteners.current = [ul1, ul2, ul3, ul4, ul5].filter(Boolean) as Array<() => void>;
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // ── progress polling ───────────────────────────────────────────────────────
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (isPlaying && isLoaded) {
      progressInterval.current = setInterval(async () => {
        // jangan overwrite nilai slider saat user sedang drag
        if (isDragging.current) return;
        try {
          const pos = await playerService.getCurrentPosition();
          setSongProgress(pos);
        } catch {
          // sink mungkin kosong di antara lagu
        }
      }, 500);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, isLoaded]);

  // ── duration from song metadata ────────────────────────────────────────────
  useEffect(() => {
    if (currentSong?.duration) setDuration(currentSong.duration);
  }, [currentSong]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    if (!isLoaded) return;
    isPlaying ? await pause() : await play();
  }, [isPlaying, isLoaded]);

  const handleSeekStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  // saat drag: update tampilan lokal saja, JANGAN panggil backend
  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(Number(e.target.value));
  }, []);

  // saat lepas: baru commit ke backend, lalu lepas scrub lokal
  const handleSeekCommit = useCallback(async (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    const val = Number((e.target as HTMLInputElement).value);
    setScrubValue(null);
    await seek(val);
  }, [seek]);

  const handleVolume = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setIsMuted(val === 0);
      await setVolume(val);
    },
    [setVolume]
  );

  const handleMuteToggle = useCallback(async () => {
    if (isMuted) {
      setIsMuted(false);
      await setVolume(prevVolume || 20);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      await setVolume(0);
    }
  }, [isMuted, volume, prevVolume, setVolume]);

  const cycleRepeat = useCallback(async () => {
    // 0 = no repeat, 1 = repeat all, 2 = repeat one
    const next = (repeatMode + 1) % 3;
    await setRepeatMode(next);
  }, [repeatMode, setRepeatMode]);

  // saat drag pakai scrubValue, saat idle pakai songProgress dari store
  const displayProgress = scrubValue !== null ? scrubValue : songProgress;
  const progressPct = duration > 0 ? (displayProgress / duration) * 100 : 0;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mpw-root">
        {/* album art */}
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

        {/* song info */}
        <div className="mpw-info">
          <p className="mpw-info-title">{currentSong?.name ?? "No song selected"}</p>
          <p className="mpw-info-sub">
            {currentSong?.artist ?? currentSong?.album_artist ?? "—"}
            {currentSong?.album ? ` · ${currentSong.album}` : ""}
          </p>
        </div>

        {/* progress */}
        <div className="mpw-progress-row">
          <span className="mpw-time">{formatTime(displayProgress)}</span>
          <input
            type="range"
            className="mpw-slider mpw-progress-slider"
            min={0}
            max={duration || 100}
            step={0.5}
            value={displayProgress}
            onPointerDown={handleSeekStart}
            onChange={handleSeekChange}
            onPointerUp={handleSeekCommit}
            disabled={!isLoaded}
            style={{ "--pct": `${progressPct}%` } as React.CSSProperties}
          />
          <span className="mpw-time">{formatTime(duration)}</span>
        </div>

        {/* controls */}
        <div className="mpw-controls">
          {/* shuffle */}
          <button
            className={`mpw-btn-icon ${isShuffle ? "active" : ""}`}
            onClick={setShuffleMode}
            title="Shuffle"
            aria-label="Shuffle"
          >
            <IconShuffle />
          </button>

          {/* previous */}
          <button
            className="mpw-btn-icon"
            onClick={previous}
            disabled={!isLoaded}
            title="Previous"
            aria-label="Previous"
          >
            <IconPrev />
          </button>

          {/* play / pause */}
          <button
            className="mpw-btn-play"
            onClick={handlePlayPause}
            disabled={!isLoaded}
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          {/* next */}
          <button
            className="mpw-btn-icon"
            onClick={next}
            disabled={!isLoaded}
            title="Next"
            aria-label="Next"
          >
            <IconNext />
          </button>

          {/* repeat */}
          <button
            className={`mpw-btn-icon ${repeatMode > 0 ? "active" : ""}`}
            onClick={cycleRepeat}
            title={["No repeat", "Repeat all", "Repeat one"][repeatMode]}
            aria-label="Repeat"
          >
            <IconRepeat />
            {repeatMode === 2 && <span className="mpw-repeat-badge">1</span>}
          </button>
        </div>

        {/* volume + source */}
        <div className="mpw-bottom-row">
          <button
            className="mpw-btn-icon"
            onClick={handleMuteToggle}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <IconVolume muted={isMuted} />
          </button>

          <input
            type="range"
            className="mpw-slider mpw-volume-slider"
            min={0}
            max={50}
            step={1}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            style={{ "--pct": `${((isMuted ? 0 : volume) / 50) * 100}%` } as React.CSSProperties}
            aria-label="Volume"
          />

          <button
            className="mpw-btn-source"
            onClick={() => setShowSource(true)}
            title="Choose source"
          >
            <IconFolder />
            <span>Source</span>
          </button>
        </div>
      </div>

      {showSource && <SourcePicker onClose={() => setShowSource(false)} />}

      <style>{`
        /* ── root ── */
        .mpw-root {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          width: 100%;
          box-sizing: border-box;
          color: inherit;
        }

        /* ── album art ── */
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

        /* ── song info ── */
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

        /* ── progress ── */
        .mpw-progress-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mpw-time {
          font-size: 0.7rem;
          opacity: 0.5;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          min-width: 28px;
        }
        .mpw-time:last-child { text-align: right; }

        /* ── slider base ── */
        .mpw-slider {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            currentColor var(--pct, 0%),
            color-mix(in srgb, currentColor 20%, transparent) var(--pct, 0%)
          );
        }
        .mpw-slider:disabled { opacity: 0.3; cursor: default; }
        .mpw-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .mpw-slider:not(:disabled):hover::-webkit-slider-thumb {
          transform: scale(1.3);
        }
        .mpw-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: currentColor;
          border: none;
          cursor: pointer;
        }
        .mpw-volume-slider { max-width: 90px; }

        /* ── controls row ── */
        .mpw-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* ── icon button ── */
        .mpw-btn-icon {
          position: relative;
          background: none;
          border: none;
          padding: 6px;
          cursor: pointer;
          color: inherit;
          opacity: 0.55;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s, background 0.15s;
        }
        .mpw-btn-icon:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
        .mpw-btn-icon.active { opacity: 1; }
        .mpw-btn-icon:disabled { opacity: 0.2; cursor: default; }

        .mpw-repeat-badge {
          position: absolute;
          top: 1px;
          right: 1px;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
        }

        /* ── play button ── */
        .mpw-btn-play {
          background: currentColor;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, opacity 0.15s;
          color: inherit;
        }
        .mpw-btn-play svg { color: canvas; filter: invert(1) grayscale(1) contrast(9); }
        .mpw-btn-play:hover { transform: scale(1.06); }
        .mpw-btn-play:active { transform: scale(0.96); }
        .mpw-btn-play:disabled { opacity: 0.3; cursor: default; transform: none; }

        /* ── bottom row ── */
        .mpw-bottom-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── source button ── */
        .mpw-btn-source {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 4px;
          background: color-mix(in srgb, currentColor 10%, transparent);
          border: none;
          padding: 4px 10px;
          border-radius: 20px;
          cursor: pointer;
          color: inherit;
          font-size: 0.75rem;
          opacity: 0.7;
          transition: opacity 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .mpw-btn-source:hover {
          opacity: 1;
          background: color-mix(in srgb, currentColor 18%, transparent);
        }

        /* ── source picker overlay ── */
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
          gap: 0;
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
        .mpw-folder-tab {
          display: flex;
          flex-direction: column;
        }
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
        .mpw-folder-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .mpw-folder-btn-scan {
          background: color-mix(in srgb, currentColor 15%, transparent);
        }
        .mpw-folder-btn-scan:hover:not(:disabled) {
          background: color-mix(in srgb, currentColor 24%, transparent);
        }
        .mpw-folder-btn-scan.scanning svg {
          animation: mpw-spin 1s linear infinite;
        }
        @keyframes mpw-spin {
          to { transform: rotate(360deg); }
        }
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
