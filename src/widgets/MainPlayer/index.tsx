// index.tsx — MusicPlayer widget entry point
//
// File ini HANYA bertugas:
//   1. Mendaftarkan Tauri event listeners dan polling durasi
//   2. Menyatukan semua sub-komponen dalam satu layout
//
// Impor di tempat lain cukup: import { MusicPlayer } from "@/widgets/MusicPlayer"
//
// Dependensi store  : playerStore (loadPlayerState, setCurrentSong, setIsPlaying, stop, updateSongDetails)
// Dependensi service: playerService (onCurrentSong, onControlsPlayPause, onQueueCleared, onUpdateSong, onShuffleMode)
// Sub-komponen      : AlbumArt, ProgressSlider, PlayerControls, VolumeControl, SettingsCenter

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { playerService } from "../../services/playerService";
import { AlbumArt } from "./AlbumArt";
import { ProgressSlider } from "./ProgressSlider";
import { PlayerControls } from "./PlayerControls";
import { SettingsCenter } from "../SettingsCenter";
import MichieLogo from "../../images/logo.svg";

export function MusicPlayer() {
  const {
    loadPlayerState,
    setCurrentSong,
    setIsPlaying,
    stop,
    updateSongDetails,
  } = usePlayerStore();

  const currentSong = usePlayerStore((s) => s.currentSong);

  // Durasi disimpan lokal karena datang dari event backend, bukan dari store
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const unlisteners = useRef<Array<() => void>>([]);

  // Setup Tauri event listeners
  useEffect(() => {
    loadPlayerState();

    const setup = async () => {
      // Lagu berganti → update store dan durasi
      const ul1 = await playerService.onCurrentSong((e) => {
        const song = (e.payload as { q: any }).q;
        setCurrentSong(song);
        setDuration(song?.duration ?? 0);
      });

      // Backend kirim sinyal play/pause (misalnya dari media key OS)
      const ul2 = await playerService.onControlsPlayPause((e) => {
        setIsPlaying(e.payload as unknown as boolean);
      });

      // Queue dikosongkan → reset player
      const ul3 = await playerService.onQueueCleared(() => {
        stop();
        setDuration(0);
      });

      // Metadata lagu diupdate (misalnya setelah scan)
      const ul4 = await playerService.onUpdateSong(async (e) => {
        const { dir_path } = e.payload as { dir_path: string };
        await updateSongDetails(dir_path);
      });

      // Shuffle mode berubah dari backend (sudah dihandle store via setShuffleModeState)
      const ul5 = await playerService.onShuffleMode(() => {});

      unlisteners.current = [ul1, ul2, ul3, ul4, ul5].filter(Boolean) as Array<
        () => void
      >;
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
    };
  }, []);

  // Durasi juga bisa datang dari currentSong.duration (saat restore dari localStorage)
  useEffect(() => {
    if (currentSong?.duration) {
      setDuration(currentSong.duration);
    }
  }, [currentSong]);

  return (
    <>
      <div className="mpw-root glass solid panel">
        <div className="mpw-header">
          <div className="mpw-brand">
            <img src={MichieLogo} alt="Michie logo" className="mpw-brand-logo" />
            <span className="mpw-brand-name">Michie</span>
          </div>

          <button
            className="mpw-btn-menu"
            onClick={() => setShowSettings(true)}
            title="Settings"
            aria-label="Settings panel"
          >
            ⋮
          </button>
        </div>

        <AlbumArt />
        <ProgressSlider duration={duration} />
        <PlayerControls />
      </div>

      {showSettings && <SettingsCenter onClose={() => setShowSettings(false)} />}

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
          color: inherit;
        }

        .mpw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mpw-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
        }

        .mpw-brand-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          font-size: 16px;
          line-height: 1;
        }

        .mpw-brand-name {
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .mpw-btn-menu {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          color: inherit;
          font-size: 18px;
          line-height: 1;
          opacity: 0.65;
          transition:
            opacity 0.15s ease,
            background 0.15s ease,
            transform 0.15s ease;
        }

        .mpw-btn-menu:hover {
          opacity: 1;
          background: color-mix(in srgb, currentColor 12%, transparent);
        }

        .mpw-btn-menu:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
}