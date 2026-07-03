// ProgressSlider.tsx
// Slider progress lagu — drag dibuat "imperative" (langsung tulis ke DOM lewat ref,
// di-throttle ke requestAnimationFrame) supaya fill bar & label waktu tidak
// tertinggal dari posisi thumb native saat digeser. React state & seek() ke
// backend hanya disentuh SEKALI, saat pointer dilepas.
//
// Membaca : songProgress, isPlaying, isLoaded dari playerStore (selector sempit,
//           shallow-compare — komponen ini tidak re-render karena field store lain berubah)
// Memanggil: seek() dari playerStore, getCurrentPosition() dari playerService
// Props   : duration (detik), dioper dari parent yang sudah tahu durasi lagu

import { useRef, useCallback, useEffect } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { playerService } from "../../services/playerService";
import { useShallow } from "zustand/react/shallow"; // hapus baris ini kalau bukan pakai zustand v4+

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
  // selector sempit + shallow compare -> komponen ini HANYA re-render kalau
  // songProgress/isPlaying/isLoaded berubah, bukan setiap field store lain.
  const { songProgress, isPlaying, isLoaded } = usePlayerStore(
    useShallow((s) => ({
      songProgress: s.songProgress,
      isPlaying: s.isPlaying,
      isLoaded: s.isLoaded,
    }))
  );
  const seek = usePlayerStore((s) => s.seek);
  const setSongProgress = usePlayerStore((s) => s.setSongProgress);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);

  const isDragging = useRef(false);
  const rafId = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tulis langsung ke DOM (bukan lewat setState) -> tidak menunggu React commit,
  // jadi fill bar & angka waktu selalu selangkah dengan kursor.
  const paint = useCallback(
    (val: number) => {
      if (inputRef.current) {
        const pct = duration > 0 ? (val / duration) * 100 : 0;
        inputRef.current.style.setProperty("--pct", `${pct}%`);
      }
      if (currentTimeRef.current) {
        currentTimeRef.current.textContent = formatTime(val);
      }
    },
    [duration]
  );

  // polling posisi dari backend — dimatikan saat drag (sama seperti sebelumnya)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (isPlaying && isLoaded) {
      pollRef.current = setInterval(async () => {
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
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isPlaying, isLoaded, setSongProgress]);

  // saat songProgress berubah dari LUAR drag (polling / ganti lagu), sinkronkan
  // input native + tampilan secara manual, karena input sekarang uncontrolled.
  useEffect(() => {
    if (isDragging.current) return;
    if (inputRef.current) inputRef.current.value = String(songProgress);
    paint(songProgress);
  }, [songProgress, paint]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  // fire terus-menerus selama drag (React memetakan ini ke native 'input' event).
  // Nilai mentah cuma disimpan di ref; penulisan ke DOM di-throttle ke rAF supaya
  // tidak lebih sering dari refresh rate layar.
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const val = Number((e.target as HTMLInputElement).value);
      pendingValue.current = val;
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          if (pendingValue.current != null) paint(pendingValue.current);
          rafId.current = null;
        });
      }
    },
    [paint]
  );

  // commit sekali: sinkronkan React state, lalu kirim SATU kali seek ke backend.
  const commit = useCallback(async () => {
    isDragging.current = false;
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const val = pendingValue.current ?? songProgress;
    pendingValue.current = null;

    setSongProgress(val);
    await seek(val);
  }, [seek, setSongProgress, songProgress]);

  const handlePointerUp = useCallback(() => {
    commit();
  }, [commit]);

  // penting: kalau drag terputus (misal alt-tab / pointer keluar OS window),
  // tetap commit alih-alih membiarkan isDragging.current nyangkut di true selamanya.
  const handlePointerCancel = useCallback(() => {
    commit();
  }, [commit]);

  return (
    <>
      <div className="mpw-progress-row">
        <span className="mpw-time" ref={currentTimeRef}>
          {formatTime(songProgress)}
        </span>
        <input
          ref={inputRef}
          type="range"
          className="mpw-slider mpw-progress-slider"
          min={0}
          max={duration || 100}
          step={0.5}
          defaultValue={songProgress}
          onPointerDown={handlePointerDown}
          onInput={handleInput}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          disabled={!isLoaded}
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