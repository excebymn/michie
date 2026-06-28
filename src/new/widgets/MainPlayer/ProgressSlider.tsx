// ProgressSlider.tsx
// Slider progress lagu dengan proteksi drag — polling tidak overwrite saat user geser.
// Membaca : songProgress, isLoaded dari playerStore
// Memanggil: seek() dari playerStore, getCurrentPosition() dari playerService
// Props   : duration (detik), dioper dari parent yang sudah tahu durasi lagu

import { useState, useRef, useCallback, useEffect } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { playerService } from "../../services/playerService";

interface ProgressSliderProps {
  duration: number;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressSlider({ duration }: ProgressSliderProps) {
  const { songProgress, isPlaying, isLoaded, seek, setSongProgress } = usePlayerStore();

  // nilai lokal saat drag — agar polling tidak overwrite posisi thumb
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const isDragging = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // polling posisi dari backend, dimatikan saat drag
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isPlaying && isLoaded) {
      intervalRef.current = setInterval(async () => {
        if (isDragging.current) return;
        try {
          const pos = await playerService.getCurrentPosition();
          setSongProgress(pos);
        } catch {
          // sink kosong antar lagu — abaikan
        }
      }, 500);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isLoaded]);

  const handlePointerDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  // saat drag: update UI lokal saja, backend belum disentuh
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(Number(e.target.value));
  }, []);

  // saat lepas: commit ke backend sekali
  const handlePointerUp = useCallback(async (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    const val = Number((e.target as HTMLInputElement).value);
    setScrubValue(null);
    await seek(val);
  }, [seek]);

  const displayProgress = scrubValue !== null ? scrubValue : songProgress;
  const pct = duration > 0 ? (displayProgress / duration) * 100 : 0;

  return (
    <>
      <div className="mpw-progress-row">
        <span className="mpw-time">{formatTime(displayProgress)}</span>
        <input
          type="range"
          className="mpw-slider mpw-progress-slider"
          min={0}
          max={duration || 100}
          step={0.5}
          value={displayProgress}
          onPointerDown={handlePointerDown}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          disabled={!isLoaded}
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
        />
        <span className="mpw-time mpw-time-right">{formatTime(duration)}</span>
      </div>

      <style>{`
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
        .mpw-time-right { text-align: right; }

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
      `}</style>
    </>
  );
}