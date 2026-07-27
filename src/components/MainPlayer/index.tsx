import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useAppStore } from "../../stores/appStore";
import { useShortcutsStore } from "../../stores/shortcutStore";
import { useWindowModeStore } from "../../stores/windowModeStore";
import { playerService } from "../../services/playerService";
import { appService } from "../../services/appService";
import { eventToCombo, isTypingTarget } from "../../utils/KeyCombo";
import { AlbumArt } from "./AlbumArt";
import { ProgressSlider } from "./ProgressSlider";
import { PlayerControls } from "./PlayerControls";
import { SettingsCenter } from "../SettingsCenter";
import { WidgetTray } from "../WidgetTray";
import { WindowControls } from "./windowControls";
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
  const compactMode = useWindowModeStore((s) => s.compactMode);

  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetTray, setShowWidgetTray] = useState(false);
  const unlisteners = useRef<Array<() => void>>([]);
  const durationRef = useRef(0);

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

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Global keyboard shortcut listener — didaftarkan sekali di sini karena MainPlayer
  // satu-satunya komponen yang dijamin selalu mounted (konvensi #3 project). Kombinasi
  // tombol dibaca live dari shortcutsStore (bukan dependency array) supaya rebind di
  // panel Shortcuts langsung kepakai tanpa perlu re-register listener ini.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Lagi merekam kombinasi baru di panel Shortcuts — biarkan listener capture-phase
      // panel itu yang nangkep, jangan sampai kepencet dobel jadi aksi beneran juga.
      if (useShortcutsStore.getState().isCapturing) return;
      if (isTypingTarget(e.target)) return;

      const combo = eventToCombo(e);
      if (!combo) return;

      const actionId = useShortcutsStore.getState().findActionForCombo(combo);
      if (!actionId) return;

      e.preventDefault();

      const player = usePlayerStore.getState();

      switch (actionId) {
        case "play_pause":
          if (!player.isLoaded) break;
          if (player.isPlaying) player.pause();
          else player.play();
          break;
        case "next_song":
          player.next();
          break;
        case "previous_song":
          player.previous();
          break;
        case "seek_forward": {
          const target = Math.min(
            player.songProgress + 10,
            durationRef.current || player.songProgress + 10,
          );
          player.seek(target);
          break;
        }
        case "seek_backward": {
          const target = Math.max(player.songProgress - 10, 0);
          player.seek(target);
          break;
        }
        case "volume_up":
          player.setVolume(Math.min(player.volume + 5, 50));
          break;
        case "volume_down":
          player.setVolume(Math.max(player.volume - 5, 0));
          break;
        case "toggle_shuffle":
          player.setShuffleMode();
          break;
        case "cycle_repeat":
          // Asumsi urutan mode: 0 = tanpa repeat, 1 = repeat semua, 2 = repeat satu.
          // Sesuaikan urutan ini kalau ternyata beda di sisi Rust.
          player.setRepeatMode(((player.repeatMode + 1) % 3) as number);
          break;
        case "toggle_favorite":
          if (player.currentSong) {
            // NOTE: signature appService.toggleFavorite belum diverifikasi langsung
            // dari file aslinya — sesuaikan kalau parameternya beda.
            appService.toggleFavorite(player.currentSong.path);
          }
          break;
        case "open_settings":
          setShowSettings((v) => !v);
          break;
        case "open_widget_tray":
          setShowWidgetTray((v) => !v);
          break;
        case "close_overlay":
          setShowSettings(false);
          setShowWidgetTray(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <div
        className={
          "mpw-root michie-box michie-box--primary" +
          (compactMode ? " mpw-root--compact" : "")
        }
      >
        <div className="mpw-header" data-tauri-drag-region>
          <div
            className="mpw-brand michie-box michie-box--secondary"
            data-tauri-drag-region
          >
            <img
              src={MichieLogo}
              alt="Michie logo"
              className="mpw-brand-logo michie-circle "
            />
            <span className="mpw-brand-name michie-text-primary">michie</span>
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

            <WindowControls />
          </div>
        </div>
        <div className="container">
          <div className="son-of-container">
            <AlbumArt />
          </div>
          <div className="son-of-container son-of-container--progress">
            <ProgressSlider duration={duration} />
          </div>
          <div className="son-of-container">
            <PlayerControls />
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsCenter onClose={() => setShowSettings(false)} />
      )}

      {showWidgetTray && (
        <WidgetTray onClose={() => setShowWidgetTray(false)} />
      )}

      <style>{`
/*
  Sistem widget resize slot-nya, bukan viewport — jadi kita bikin
  .mpw-root jadi CSS container query context (bukan @media). Semua
  child (header, AlbumArt, ProgressSlider, PlayerControls) bisa baca
  cqw/cqh (persen dari lebar/tinggi SLOT INI, bukan window) buat
  clamp() ukuran mereka sendiri. Ini yang bikin player ikut mengecil
  proporsional pas slot kanan/kiri hilang, alih-alih overflow/kepotong.
*/
.mpw-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden; /* jaring pengaman terakhir kalau ada kasus ekstrem yang belum ke-cover clamp */
  container-type: size;
  container-name: mpw-player;
}

.container{
  flex: 1;               /* mengisi sisa ruang setelah header */
  display: flex;
  flex-direction: column;
  justify-content: center; /* ini yang membuat kontennya di tengah */
  align-items: center;     /* penting: album art sekarang bisa lebih sempit dari 100% saat slot pendek */
  min-width: 0;
  min-height: 0; /* WAJIB: tanpa ini flex-column tidak pernah mengecil di bawah tinggi konten alaminya */
  width: 100%;
  transition: flex-direction 0.2s ease;
}
  .son-of-container{
  padding : 7px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  }

.mpw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 4px;
  min-width: 0;
}
.mpw-brand { display: flex; align-items: center; gap: 8px; user-select: none; min-width: 0; padding : 5px;}
.mpw-brand-logo { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; font-size: 16px; line-height: 1; flex-shrink: 0; }
.mpw-brand-name {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.mpw-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mpw-btn-menu { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 50%; cursor: pointer; transition: transform 0.15s ease; flex-shrink: 0; }
.mpw-btn-menu:active { transform: scale(0.95); }
.mpw-icon-menu { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
.mpw-icon-menu svg { display: block; width: 100%; height: 100%; }

/* Slot sangat sempit: nama brand "michie" disembunyikan, logo & tombol
   (fungsi) tetap ada semua — cuma teks dekoratif yang hilang. */
@container mpw-player (max-width: 200px) {
  .mpw-brand-name { display: none; }
}

/* ---- Compact Mode ----
   Layout-only: window/slot TIDAK di-resize sama sekali, cuma isi di
   dalam yang di-collapse jadi baris horizontal ringkas (album art +
   controls), ProgressSlider disembunyikan. Aman dipakai di WM apa pun
   (termasuk tiling seperti Hyprland) karena tidak minta apa-apa ke OS. */
.mpw-root--compact .container {
  flex-direction: row;
  justify-content: flex-start;
  gap: 4px;
}
.mpw-root--compact .son-of-container {
  width: auto;
  padding: 4px;
}
.mpw-root--compact .son-of-container--progress {
  display: none;
}
.mpw-root--compact .mpw-brand-name {
  display: none;
}
      `}</style>
    </>
  );
}