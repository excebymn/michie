// ProgressSlider.tsx
// Slider progress bergaya Material: dua segmen pill (played = navy, sisa = abu-abu)
// dengan celah kecil di titik pemutaran (bukan native <input type="range">, karena
// gap dua warna ini tidak bisa rapi dicapai lewat styling ::-webkit-slider-thumb).
//
// FIX BUG UTAMA: sebelumnya, setelah pointerup posisi kadang "balik lagi" ke sebelum
// drag. Penyebabnya race condition — polling getCurrentPosition() sempat jalan lagi
// SEBELUM seek() ke backend benar-benar selesai, lalu nimpa balik state pakai posisi
// lama. Fix: polling tetap "ditahan" (suppressPoll) sampai await seek() selesai,
// bukan langsung dilepas saat pointerup.
//
// Membaca : songProgress, isPlaying, isLoaded dari playerStore (selector sempit + shallow)
// Memanggil: seek() dari playerStore, getCurrentPosition() dari playerService
// Props   : duration (detik), dioper dari parent yang sudah tahu durasi lagu

import { useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { playerService } from "../../services/playerService";
import { useShallow } from "zustand/react/shallow"; // hapus kalau bukan zustand v4+

interface ProgressSliderProps {
  duration: number;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function ProgressSlider({ duration }: ProgressSliderProps) {
  const { songProgress, isPlaying, isLoaded } = usePlayerStore(
    useShallow((s) => ({
      songProgress: s.songProgress,
      isPlaying: s.isPlaying,
      isLoaded: s.isLoaded,
    }))
  );
  const seek = usePlayerStore((s) => s.seek);
  const setSongProgress = usePlayerStore((s) => s.setSongProgress);

  const trackRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const unplayedRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);

  const isDragging = useRef(false);
  // Beda dengan isDragging: ini tetap TRUE sampai backend selesai seek,
  // bukan cuma sampai pointer dilepas. Inilah yang menutup celah race condition.
  const suppressPoll = useRef(false);

  const rafId = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const GAP_PX = 8; // lebar celah antara dua segmen, di titik pemutaran

  // tulis langsung ke DOM (tanpa setState) supaya visual 1:1 dengan gerakan mouse
  const paint = useCallback(
    (val: number) => {
      const pct = duration > 0 ? clamp(val / duration, 0, 1) : 0;
      const half = GAP_PX / 2;

      if (playedRef.current) {
        playedRef.current.style.width = `calc(${pct * 100}% - ${half}px)`;
      }
      if (unplayedRef.current) {
        unplayedRef.current.style.left = `calc(${pct * 100}% + ${half}px)`;
        unplayedRef.current.style.width = `calc(${(1 - pct) * 100}% - ${half}px)`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `${pct * 100}%`;
      }
      if (currentTimeRef.current) {
        currentTimeRef.current.textContent = formatTime(val);
      }
    },
    [duration]
  );

  // sinkron pertama kali & tiap kali duration berubah (ganti lagu)
  useLayoutEffect(() => {
    paint(songProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // polling posisi dari backend — ditahan selama drag DAN selama seek() backend berjalan
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (isPlaying && isLoaded) {
      pollRef.current = setInterval(async () => {
        if (suppressPoll.current) return;
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

  // saat songProgress berubah dari luar drag (polling / lagu ganti), sinkronkan visual
  useEffect(() => {
    if (isDragging.current) return;
    paint(songProgress);
  }, [songProgress, paint]);

  const valueFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * duration;
    },
    [duration]
  );

  const schedulePaint = useCallback(
    (val: number) => {
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

  // commit HANYA dipanggil sekali per gesture: sinkronkan state, kirim seek,
  // dan baru lepas "kunci" polling setelah backend beneran selesai.
  const commit = useCallback(async () => {
    isDragging.current = false;
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const val = pendingValue.current ?? songProgress;
    pendingValue.current = null;

    setSongProgress(val);
    try {
      await seek(val);
    } finally {
      suppressPoll.current = false;
    }
  }, [seek, setSongProgress, songProgress]);

  // pembersih listener window aktif — dipanggil saat pointerup/cancel,
  // ATAU saat komponen unmount di tengah drag
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isLoaded) return;
      isDragging.current = true;
      suppressPoll.current = true;

      // klik di mana saja di track -> langsung loncat ke posisi itu.
      // Dijalankan SEBELUM setPointerCapture: kalau capture-nya throw
      // (umum di sebagian WebView, mis. webkit2gtk di Linux), baris ini tetap
      // sempat jalan duluan — sebelumnya urutannya kebalik, jadi kalau capture
      // gagal, klik jadi tidak berefek sama sekali.
      schedulePaint(valueFromPointer(e.clientX));

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // capture gagal/tidak didukung — tidak masalah, drag tetap jalan
        // lewat listener window di bawah.
      }

      // drag di-drive dari window, bukan dari elemen track — supaya tidak
      // bergantung pada dukungan pointer capture WebView, dan tetap jalan
      // mulus walau pointer sedikit keluar dari area track yang tipis.
      const onMove = (ev: PointerEvent) => {
        if (!isDragging.current) return;
        schedulePaint(valueFromPointer(ev.clientX));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        dragCleanupRef.current = null;
        commit();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      dragCleanupRef.current = onUp;
    },
    [isLoaded, valueFromPointer, schedulePaint, commit]
  );

  // dukungan keyboard dasar untuk aksesibilitas (opsional tapi murah untuk ditambahkan)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isLoaded) return;
      let delta = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 5;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -5;
      else if (e.key === "Home") delta = -duration;
      else if (e.key === "End") delta = duration;
      else return;

      e.preventDefault();
      const val = clamp(songProgress + delta, 0, duration);
      suppressPoll.current = true;
      paint(val);
      setSongProgress(val);
      seek(val).finally(() => {
        suppressPoll.current = false;
      });
    },
    [isLoaded, duration, songProgress, paint, setSongProgress, seek]
  );

  return (
    <div className="mpw-progress-row">
      <span className="mpw-time" ref={currentTimeRef}>
        {formatTime(songProgress)}
      </span>

      <div
        ref={trackRef}
        className={`mpw-track ${!isLoaded ? "mpw-track--disabled" : ""}`}
        role="slider"
        tabIndex={isLoaded ? 0 : -1}
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={songProgress}
        aria-label="Progress lagu"
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div ref={playedRef} className="mpw-track-played glass solid panel" />
        <div ref={unplayedRef} className="mpw-track-unplayed glass solid panel" />
        <div ref={thumbRef} className="mpw-thumb glass solid panel" />
      </div>

      <span className="mpw-time mpw-time-right">{formatTime(duration)}</span>

      <style>{`
        .mpw-progress-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mpw-time {
          font-size: 0.7rem;
          opacity: 0.5;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          min-width: 28px;
        }
        .mpw-time-right { text-align: right; }

        .mpw-track {
          --mpw-track-h: 8px;
          --mpw-color-played: #2b3b5c;
          --mpw-color-unplayed: #9b9b9b;

          position: relative;
          flex: 1;
          height: 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
          touch-action: none;
        }
        .mpw-track--disabled {
          cursor: default;
          opacity: 0.4;
          pointer-events: none;
        }

        .mpw-track-played,
        .mpw-track-unplayed {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          height: var(--mpw-track-h);
          border-radius: 999px;
          width: 0;
        }
        .mpw-track-played { background: var(--mpw-color-played); }
        .mpw-track-unplayed { background: var(--mpw-color-unplayed); }

        .mpw-thumb {
          position: absolute;
          top: 50%;
          left: 0;
          width: 4px;
          height: var(--mpw-track-h);
          border-radius: 999px;
          background: var(--mpw-color-played);
          transform: translate(-50%, -50%);
          transition: width 0.12s ease, height 0.12s ease;
        }
        .mpw-track:hover .mpw-thumb,
        .mpw-track:active .mpw-thumb {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}