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
// Sub-komponen      : AlbumArt, ProgressSlider, PlayerControls, VolumeControl, SourcePicker

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { playerService } from "../../services/playerService";
import { AlbumArt } from "./AlbumArt";
import { ProgressSlider } from "./ProgressSlider";
import { PlayerControls } from "./PlayerControls";
import { VolumeControl } from "./VolumeControl";
import { SourcePicker } from "./SourcePicker";
import { IconFolder } from "./Icons";

export function MusicPlayer() {
  const {
    loadPlayerState,
    setCurrentSong,
    setIsPlaying,
    stop,
    updateSongDetails,
  } = usePlayerStore();

  // durasi disimpan di sini karena datang dari event backend, bukan dari store
  const [duration, setDuration] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const unlisteners = useRef<Array<() => void>>([]);

  useEffect(() => {
    loadPlayerState();

    const setup = async () => {
      // lagu berganti → update store dan durasi
      const ul1 = await playerService.onCurrentSong((e) => {
        const song = (e.payload as { q: any }).q;
        setCurrentSong(song);
        setDuration(song?.duration ?? 0);
      });

      // backend kirim sinyal play/pause (misalnya dari media key OS)
      const ul2 = await playerService.onControlsPlayPause((e) => {
        setIsPlaying(e.payload as unknown as boolean);
      });

      // queue dikosongkan → reset player
      const ul3 = await playerService.onQueueCleared(() => {
        stop();
        setDuration(0);
      });

      // metadata lagu diupdate (misalnya setelah scan)
      const ul4 = await playerService.onUpdateSong(async (e) => {
        const { dir_path } = e.payload as { dir_path: string };
        await updateSongDetails(dir_path);
      });

      // shuffle mode berubah dari backend (sudah dihandle store via setShuffleModeState)
      const ul5 = await playerService.onShuffleMode(() => {});

      unlisteners.current = [ul1, ul2, ul3, ul4, ul5].filter(Boolean) as Array<() => void>;
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
    };
  }, []);

  // durasi juga bisa datang dari currentSong.duration (saat restore dari localStorage)
  const currentSong = usePlayerStore((s) => s.currentSong);
  useEffect(() => {
    if (currentSong?.duration) setDuration(currentSong.duration);
  }, [currentSong]);

  return (
    <>
      <div className="mpw-root">
        <AlbumArt />
        <ProgressSlider duration={duration} />
        <PlayerControls />

        <div className="mpw-bottom-row">
          <VolumeControl />
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
        .mpw-root {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          width: 100%;
          box-sizing: border-box;
          color: inherit;
        }
        .mpw-bottom-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
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
      `}</style>
    </>
  );
}