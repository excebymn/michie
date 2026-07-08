import { useEffect, useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

import { usePlayerStore } from "../../stores/playerStore";
import type { Songs } from "../../globalValues";

import "./Vinyl.css";

function buildArtUrl(cover?: string): string | undefined {
  if (!cover) return undefined;

  // Base64
  if (cover.startsWith("data:image")) {
    return cover;
  }

  // URL
  if (
    cover.startsWith("http://") ||
    cover.startsWith("https://") ||
    cover.startsWith("asset:")
  ) {
    return cover;
  }

  // Path lokal
  try {
    return convertFileSrc(cover);
  } catch {
    return undefined;
  }
}

export default function VinylPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong) as Songs | null;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [currentSong?.cover]);

  const artUrl = useMemo(
    () => buildArtUrl(currentSong?.cover),
    [currentSong?.cover],
  );

  const hasSong = currentSong !== null;

  const title = currentSong?.name ?? "No media";
  const artist = currentSong?.artist ?? "Unknown Artist";

  const handleToggle = async () => {
    if (!hasSong) return;

    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  return (
    <div className="michie-box michie-box--primary vinyl-player">
      <div className="vinyl-player__knobs">
        <button
          type="button"
          className={`michie-circle michie-circle--secondary vinyl-player__knob ${
            isPlaying ? "vinyl-player__knob--active" : ""
          }`}
          onClick={handleToggle}
          disabled={!hasSong}
          aria-label={isPlaying ? "Pause" : "Play"}
        />

        <span className="michie-circle michie-circle--secondary vinyl-player__knob vinyl-player__knob--deco" />
        <span className="michie-circle michie-circle--secondary vinyl-player__knob vinyl-player__knob--deco" />
      </div>

      <div className="vinyl-player__stage">
        <div
          className={`vinyl-player__disc ${
            isPlaying ? "vinyl-player__disc--spinning" : ""
          }`}
        >
          <div className="vinyl-player__grooves" />

          <div className="michie-circle michie-circle--secondary vinyl-player__label">
            {artUrl && !imageError ? (
              <img
                src={artUrl}
                alt={title}
                className="vinyl-player__art michie-circle michie-circle--secondary"
                draggable={false}
                onError={() => {
                  console.error("failed to load album art:", currentSong?.cover);
                  setImageError(true);
                }}
              />
            ) : (
              <div className="vinyl-player__art vinyl-player__art--empty" />
            )}
          </div>
        </div>

        <div
          className={`vinyl-player__tonearm ${
            isPlaying
              ? "vinyl-player__tonearm--down"
              : "vinyl-player__tonearm--up"
          }`}
        >
          <span className="michie-box michie-box--secondary vinyl-player__pivot" />

          <span className="michie-box michie-box--secondary vinyl-player__arm" />

          <span className="michie-box michie-box--secondary vinyl-player__headshell" />

          <span className="michie-for michie-for--secondary vinyl-player__needle" />
        </div>
      </div>

      <div className="vinyl-player__meta">
        <p className="michie-text-secondary vinyl-player__title">{title}</p>

        <p className="michie-text-secondary vinyl-player__artist">{artist}</p>
      </div>
    </div>
  );
}
