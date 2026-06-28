// PlayerControls.tsx
// Tombol-tombol kontrol pemutaran: shuffle, prev, play/pause, next, repeat.
// Membaca : isPlaying, isLoaded, isShuffle, repeatMode dari playerStore
// Memanggil: play, pause, next, previous, setShuffleMode, setRepeatMode dari playerStore

import { useCallback } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconShuffle,
  IconRepeat,
} from "./Icons";

export function PlayerControls() {
  const {
    isPlaying,
    isLoaded,
    isShuffle,
    repeatMode,
    play,
    pause,
    next,
    previous,
    setShuffleMode,
    setRepeatMode,
  } = usePlayerStore();

  const handlePlayPause = useCallback(async () => {
    if (!isLoaded) return;
    isPlaying ? await pause() : await play();
  }, [isPlaying, isLoaded, play, pause]);

  const cycleRepeat = useCallback(async () => {
    // 0 = no repeat  1 = repeat all  2 = repeat one
    await setRepeatMode((repeatMode + 1) % 3);
  }, [repeatMode, setRepeatMode]);

  return (
    <>
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

      <style>{`
        .mpw-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
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
        .mpw-btn-icon:hover {
          opacity: 1;
          background: color-mix(in srgb, currentColor 10%, transparent);
        }
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
        .mpw-btn-play svg {
          color: canvas;
          filter: invert(1) grayscale(1) contrast(9);
        }
        .mpw-btn-play:hover { transform: scale(1.06); }
        .mpw-btn-play:active { transform: scale(0.96); }
        .mpw-btn-play:disabled { opacity: 0.3; cursor: default; transform: none; }
      `}</style>
    </>
  );
}