// VolumeControl.tsx
// Slider volume dan tombol mute/unmute.
// Membaca : volume dari playerStore
// Memanggil: setVolume dari playerStore

import { useState, useCallback } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { IconVolume } from "./Icons";

export function VolumeControl() {
  const { volume, setVolume } = usePlayerStore();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

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

  const displayVolume = isMuted ? 0 : volume;
  const pct = (displayVolume / 50) * 100;

  return (
    <>
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
        value={displayVolume}
        onChange={handleVolume}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        aria-label="Volume"
      />

      <style>{`
        .mpw-volume-slider {
          -webkit-appearance: none;
          appearance: none;
          max-width: 90px;
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
        .mpw-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .mpw-volume-slider:hover::-webkit-slider-thumb { transform: scale(1.3); }
        .mpw-volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: currentColor;
          border: none;
          cursor: pointer;
        }
        /* mpw-btn-icon didefinisikan di PlayerControls, shared via global style */
      `}</style>
    </>
  );
}