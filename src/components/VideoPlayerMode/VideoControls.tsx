import { useEffect, useState, type RefObject, type ChangeEvent } from "react";
import { IconPlay, IconPause } from "./Icons";

interface VideoControlsProps {
  videoRef: RefObject<HTMLVideoElement>;
  title: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function VideoControls({ videoRef, title }: VideoControlsProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Selagi user lagi drag seek bar, jangan biarkan timeupdate dari video
  // menimpa posisi yang lagi digeser (pola sama seperti suppressPoll di
  // MainPlayer/ProgressSlider.tsx buat lagu).
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      if (!seeking) setCurrentTime(el.currentTime);
    };
    const onLoadedMetadata = () => setDuration(el.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [videoRef, seeking]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  const handleSeekInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSeeking(true);
    setCurrentTime(Number(e.target.value));
  };

  const commitSeek = () => {
    const el = videoRef.current;
    if (el) el.currentTime = currentTime;
    setSeeking(false);
  };

  return (
    <div className="vc-root michie-box michie-box--primary michie-text-secondary">
      <button
        className="vc-play michie-circle michie-circle--secondary michie-text-primary"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>

      <span className="vc-title" title={title}>
        {title}
      </span>

      <span className="vc-time">{formatTime(currentTime)}</span>
      <input
        className="vc-seek"
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={handleSeekInput}
        onMouseUp={commitSeek}
        onTouchEnd={commitSeek}
      />
      <span className="vc-time">{formatTime(duration)}</span>

      <style>{`
        .vc-root {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 18px;
          border-radius: 999px;
          z-index: 5010;
        }
        .vc-play {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vc-title {
          flex-shrink: 0;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .vc-time { font-size: 0.8rem; opacity: 0.8; flex-shrink: 0; }
        .vc-seek { flex: 1; cursor: pointer; }
      `}</style>
    </div>
  );
}