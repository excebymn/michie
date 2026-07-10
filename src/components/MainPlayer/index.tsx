import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useAppStore } from "../../stores/appStore";
import { playerService } from "../../services/playerService";
import { appService } from "../../services/appService";
import { AlbumArt } from "./AlbumArt";
import { ProgressSlider } from "./ProgressSlider";
import { PlayerControls } from "./PlayerControls";
import { SettingsCenter } from "../SettingsCenter";
import { WidgetTray } from "../WidgetTray";
import MichieLogo from "../../images/logo.svg";
import { useAppearanceStore } from "../../stores/appearanceStore";
import {
  extractDominantColor,
  deriveSecondaryFor,
} from "../../services/appearanceService";

function IconMenu() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

// Ikon "wadah widget" — 4 kotak kecil, representasi 4 slot yang ada saat ini.
function IconWidgetGrid() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function MusicPlayer() {
  const {
    loadPlayerState,
    setCurrentSong,
    setIsPlaying,
    stop,
    updateSongDetails,
    setCurrentIndex,
    patchCurrentSong,
    loadQueue,
    refreshCurrentIndex,
  } = usePlayerStore();

  const currentSong = usePlayerStore((s) => s.currentSong);

  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetTray, setShowWidgetTray] = useState(false);
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    loadPlayerState();

    const setup = async () => {
      const ul1 = await playerService.onCurrentSong(async (e) => {
        const song = (e.payload as { q: any }).q;
        setCurrentSong(song);
        setDuration(song?.duration ?? 0);
        playerService.addSongToHistory(song.path); // <- baris baru
        try {
          const idx = await playerService.getCurrentIndex();
          setCurrentIndex(idx);
          localStorage.setItem("last-played-queue-position", String(idx));
        } catch {
          // queue kosong di antara transisi lagu — abaikan
        }
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

      // Sebelumnya listener ini no-op (callback kosong), jadi kalau shuffle mode
      // berubah dari luar tombol shuffle di UI ini (mis. dari device lain / media
      // key / re-shuffle otomatis saat queue habis di playerStore.next()), state
      // isShuffle di frontend tidak pernah ikut ter-update. setShuffleModeState
      // sudah tersedia di playerStore tapi belum pernah dipanggil dari mana pun.
      const ul5 = await playerService.onShuffleMode((e) => {
        const shuffled = e.payload as unknown as boolean;
        usePlayerStore.getState().setShuffleModeState(shuffled);
      });

      // Antrian berubah dari widget Queue, SongsRow, atau sumber lain — sinkronkan store
      const ul6 = await playerService.onQueueChanged(async () => {
        await loadQueue();
        await refreshCurrentIndex();
      });

      // Status "suka" berubah dari mana saja (SongsRow, Queue, AddToPlaylistMenu) —
      // disatukan di sini biar appStore.songList dan playerStore.currentSong selalu sinkron
      const ul7 = await appService.onSongFavoritedChanged((e) => {
        const { path, favorited } = e.payload as {
          path: string;
          favorited: boolean;
        };
        useAppStore.getState().setSongFavorited(path, favorited);
        const cur = usePlayerStore.getState().currentSong;
        if (cur && cur.path === path) {
          patchCurrentSong({ favorited });
        }
      });

      unlisteners.current = [ul1, ul2, ul3, ul4, ul5, ul6, ul7].filter(
        Boolean,
      ) as Array<() => void>;
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (currentSong?.duration) {
      setDuration(currentSong.duration);
    }
  }, [currentSong]);
  const paletteId = useAppearanceStore((s) => s.paletteId);
  const applyAlbumTone = useAppearanceStore((s) => s.applyAlbumTone);

  // Mode "ikut warna album art": setiap lagu berganti, ekstrak ulang warna
  // dominan dari cover-nya dan terapkan sebagai palette sementara.
  useEffect(() => {
    if (paletteId !== "album-tone") return;
    if (!currentSong?.cover) return;

    let cancelled = false;
    const assetUrl = `asset://localhost/${currentSong.cover}`;

    extractDominantColor(assetUrl).then((primaryHex) => {
      if (cancelled || !primaryHex) return;
      applyAlbumTone(primaryHex, deriveSecondaryFor(primaryHex));
    });

    return () => {
      cancelled = true;
    };
  }, [currentSong?.path, paletteId, applyAlbumTone]);

  return (
    <>
      <div className="mpw-root michie-box michie-box--primary">
        <div className="mpw-header">
          <div className="mpw-brand">
            <img
              src={MichieLogo}
              alt="Michie logo"
              className="mpw-brand-logo"
            />
            <span className="mpw-brand-name michie-text-secondary">michie</span>
          </div>

          <div className="mpw-header-actions">
            <button
              className="mpw-btn-menu michie-circle michie-circle--secondary"
              onClick={() => setShowWidgetTray(true)}
              title="Widget Tray"
              aria-label="Buka wadah widget"
            >
              <span className="mpw-icon-menu michie-text-primary">
                <IconWidgetGrid />
              </span>
            </button>

            <button
              className="mpw-btn-menu michie-circle michie-circle--secondary"
              onClick={() => setShowSettings(true)}
              title="Settings"
              aria-label="Settings panel"
            >
              <span className="mpw-icon-menu michie-text-primary">
                <IconMenu />
              </span>
            </button>
          </div>
        </div>

        <AlbumArt />
        <ProgressSlider duration={duration} />
        <PlayerControls />
      </div>

      {showSettings && (
        <SettingsCenter onClose={() => setShowSettings(false)} />
      )}

      {showWidgetTray && (
        <WidgetTray onClose={() => setShowWidgetTray(false)} />
      )}

      <style>{`
.mpw-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.mpw-header { display: flex; align-items: center; justify-content: space-between; }
.mpw-brand { display: flex; align-items: center; gap: 8px; user-select: none; }
.mpw-brand-logo { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; font-size: 16px; line-height: 1; }
.mpw-brand-name { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.02em; }
.mpw-header-actions { display: flex; align-items: center; gap: 8px; }
.mpw-btn-menu { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 50%; cursor: pointer; transition: transform 0.15s ease; }
.mpw-btn-menu:active { transform: scale(0.95); }
.mpw-icon-menu { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
.mpw-icon-menu svg { display: block; width: 100%; height: 100%; }
      `}</style>
    </>
  );
}