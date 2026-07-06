// PlayerControls.tsx
// Tombol-tombol kontrol pemutaran: shuffle, prev, play/pause, next, repeat.
// Membaca : isPlaying, isLoaded, isShuffle, repeatMode dari playerStore
// Memanggil: play, pause, next, previous, setShuffleMode, setRepeatMode dari playerStore

import { useCallback } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import IconPlay from "../../images/play-solid-full.svg"
import IconPause from "../../images/pause-solid-full.svg"
import IconShuffle from "../../images/shuffle-solid-full.svg"
import IconPrev from "../../images/previous-full.svg"
import IconNext from "../../images/next-full.svg"
import IconRepeat from "../../images/repeat-solid-full.svg"
import "../../styles/glass.css";



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
          <img src={IconShuffle} alt="Shuffle" />
        </button>

        {/* previous */}
        <button
          className="mpw-btn-icon"
          onClick={previous}
          disabled={!isLoaded}
          title="Previous"
          aria-label="Previous"
        >
          <img src={IconPrev} alt="Previous" />
        </button>

        {/* play / pause */}
        <button
          className="mpw-btn-play glass-circle"
          onClick={handlePlayPause}
          disabled={!isLoaded}
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <img src={isPlaying ? IconPause : IconPlay} alt={isPlaying ? "Pause" : "Play"} />
        </button>

        {/* next */}
        <button
          className="mpw-btn-icon"
          onClick={next}
          disabled={!isLoaded}
          title="Next"
          aria-label="Next"
        >
          <img src={IconNext} alt="Next" />
        </button>

        {/* repeat */}
        <button
          className={`mpw-btn-icon ${repeatMode > 0 ? "active" : ""}`}
          onClick={cycleRepeat}
          title={["No repeat", "Repeat all", "Repeat one"][repeatMode]}
          aria-label="Repeat"
        >
          <img src={IconRepeat} alt="Repeat" />
          {repeatMode === 2 && <span className="mpw-repeat-badge">1</span>}
        </button>
      </div>

      <style>{`
        .mpw-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .mpw-btn-icon {
          position: relative;
          background: none;
          border: none;
          padding: 10px;
          cursor: pointer;
          color: inherit;
          opacity: 0.55;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s, background 0.15s;
        }

        .mpw-btn-icon img {
          width: 24px;
          height: 24px;
          display: block;
        }

        .mpw-btn-icon:hover {
          opacity: 1;
          background: color-mix(in srgb, currentColor 10%, transparent);
        }

        .mpw-btn-icon.active {
          opacity: 1;
        }

        .mpw-btn-icon:disabled {
          opacity: 0.2;
          cursor: default;
        }

        .mpw-repeat-badge {
          position: absolute;
          top: 3px;
          right: 3px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .mpw-btn-play {
          border: none;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.12s, opacity 0.15s;
          color: inherit;
          flex-shrink: 0;
        }

        .mpw-btn-play img {
          width: 30px;
          height: 30px;
          filter: brightness(0) invert(1);
        }

        .mpw-btn-play:hover {
          transform: scale(1.06);
        }

        .mpw-btn-play:active {
          transform: scale(0.95);
        }

        .mpw-btn-play:disabled {
          opacity: 0.3;
          cursor: default;
          transform: none;
        }
      `}</style>
    </>
  );
}