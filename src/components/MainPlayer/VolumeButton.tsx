import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";

// Harus sinkron dengan MAX_VOLUME implisit di playerStore.setVolume (dibagi 50
// sebelum dikirim ke backend). Kalau nanti range backend berubah, ubah juga di sini.
const MAX_VOLUME = 50;
const SCROLL_STEP = 2;
const ARROW_STEP = 2;
const PAGE_STEP = 10;
const FLASH_DURATION_MS = 900;
const PRESETS = [0.25, 0.5, 0.75, 1];
// Perkiraan tinggi popover (slider + tombol mute + presets + padding), dipakai
// buat cek apakah cukup ruang di bawah tombol sebelum popover dirender.
const ESTIMATED_POPOVER_HEIGHT = 230;

function IconVolume({ volume }: { volume: number }) {
  const muted = volume <= 0;
  const loud = volume > MAX_VOLUME * 0.5;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon
        points="4,10 8,10 12,6 12,18 8,14 4,14"
        fill="currentColor"
        stroke="none"
      />
      {!muted && <path d="M15 9.5c1 1.4 1 3.6 0 5" />}
      {!muted && loud && <path d="M17.5 7c2.2 2.4 2.2 7.6 0 10" />}
      {muted && (
        <>
          <line x1="16" y1="9" x2="21" y2="15" />
          <line x1="21" y1="9" x2="16" y2="15" />
        </>
      )}
    </svg>
  );
}

export function VolumeButton() {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [showFlash, setShowFlash] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const mountedRef = useRef(false);
  const flashTimeoutRef = useRef<number | null>(null);
  // Ingat level sebelum mute, supaya toggle mute bisa pulih ke nilai yang sama
  // (bukan lompat balik ke default). Tidak dipersist — cukup untuk sesi ini.
  const lastNonZeroRef = useRef(volume > 0 ? volume : 20);

  useEffect(() => {
    if (volume > 0) lastNonZeroRef.current = volume;
  }, [volume]);

  // Klik di luar popover atau Escape -> tutup. Konsisten dengan pola
  // "close_overlay" yang dipakai Settings/WidgetTray di MainPlayer/index.tsx.
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // Anti-kepotong: cek ruang di bawah tombol sebelum popover terbuka, flip ke
  // atas kalau tidak cukup (mis. tombol dekat tepi bawah window/slot kecil).
  useLayoutEffect(() => {
    if (!isOpen) return;

    const computeDirection = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < ESTIMATED_POPOVER_HEIGHT ? "up" : "down");
    };

    computeDirection();
    window.addEventListener("resize", computeDirection);
    return () => window.removeEventListener("resize", computeDirection);
  }, [isOpen]);

  // Scroll wheel di atas tombol -> naik/turun volume tanpa buka popover.
  // Pakai native listener (bukan onWheel React) supaya preventDefault benar-benar
  // menahan scroll halaman, karena React attach listener wheel sebagai passive
  // by default.
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? SCROLL_STEP : -SCROLL_STEP;
      const current = usePlayerStore.getState().volume;
      const next = Math.min(MAX_VOLUME, Math.max(0, current + delta));
      usePlayerStore.getState().setVolume(next);
    };

    btn.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => btn.removeEventListener("wheel", handleWheelNative);
  }, []);

  // Flash indikator kecil tiap volume berubah dari sumber luar (shortcut
  // keyboard volume_up/volume_down di MainPlayer/index.tsx, atau scroll wheel
  // di atas) selagi popover tertutup, supaya user tetap dapat feedback visual.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (isOpen) return;

    setShowFlash(true);
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(
      () => setShowFlash(false),
      FLASH_DURATION_MS,
    );

    return () => {
      if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  const applyFromClientY = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    // Track diisi dari bawah ke atas, jadi posisi kursor dibalik relatif tinggi track.
    const ratio = 1 - (clientY - rect.top) / rect.height;
    const clamped = Math.min(1, Math.max(0, ratio));
    setVolume(Math.round(clamped * MAX_VOLUME));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragPos({ x: e.clientX, y: e.clientY });
    applyFromClientY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    applyFromClientY(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragPos(null);
  };

  // Reset cepat ke 100% — cara pintas selain drag manual.
  const handleTrackDoubleClick = () => {
    setVolume(MAX_VOLUME);
  };

  const handleTrackKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        e.preventDefault();
        setVolume(Math.min(MAX_VOLUME, volume + ARROW_STEP));
        break;
      case "ArrowDown":
      case "ArrowLeft":
        e.preventDefault();
        setVolume(Math.max(0, volume - ARROW_STEP));
        break;
      case "PageUp":
        e.preventDefault();
        setVolume(Math.min(MAX_VOLUME, volume + PAGE_STEP));
        break;
      case "PageDown":
        e.preventDefault();
        setVolume(Math.max(0, volume - PAGE_STEP));
        break;
      case "Home":
        e.preventDefault();
        setVolume(0);
        break;
      case "End":
        e.preventDefault();
        setVolume(MAX_VOLUME);
        break;
      default:
        break;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(lastNonZeroRef.current || 20);
    }
  };

  const fillPercent = (volume / MAX_VOLUME) * 100;

  return (
    <div className="mpw-volume" ref={wrapRef}>
      <button
        ref={buttonRef}
        className="mpw-btn-menu michie-circle michie-circle--secondary"
        onClick={() => setIsOpen((v) => !v)}
        title="Volume (scroll untuk atur cepat)"
        aria-label="Atur volume"
        aria-expanded={isOpen}
      >
        <span className="mpw-icon-menu michie-text-primary">
          <IconVolume volume={volume} />
        </span>
      </button>

      {showFlash && !isOpen && (
        <div
          className={`mpw-volume-flash michie-box michie-box--secondary mpw-volume-flash--${direction}`}
          aria-hidden="true"
        >
          <span className="mpw-volume-flash-icon michie-text-primary">
            <IconVolume volume={volume} />
          </span>
          <span className="mpw-volume-flash-value michie-text-primary">
            {Math.round(fillPercent)}%
          </span>
        </div>
      )}

      {isOpen && (
        <div
          className={`mpw-volume-popover michie-box michie-box--secondary mpw-volume-popover--${direction}`}
        >
          <button
            className="mpw-volume-mute michie-text-primary"
            onClick={toggleMute}
            title={volume > 0 ? "Bisukan" : "Pulihkan volume"}
            aria-label={volume > 0 ? "Bisukan" : "Pulihkan volume"}
          >
            <IconVolume volume={volume} />
          </button>

          <div
            className="mpw-volume-track"
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Level volume"
            aria-valuemin={0}
            aria-valuemax={MAX_VOLUME}
            aria-valuenow={volume}
            aria-valuetext={`${Math.round(fillPercent)}%`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleTrackDoubleClick}
            onKeyDown={handleTrackKeyDown}
          >
            <div
              className="mpw-volume-fill michie-circle--primary"
              style={{ height: `${fillPercent}%` }}
            />
            <div
              className="mpw-volume-thumb michie-circle michie-circle--primary"
              style={{ bottom: `calc(${fillPercent}% - 6px)` }}
            />
          </div>

          <span className="mpw-volume-value michie-text-primary">
            {Math.round(fillPercent)}%
          </span>

          <div className="mpw-volume-presets">
            {PRESETS.map((p) => {
              const presetValue = Math.round(p * MAX_VOLUME);
              return (
                <button
                  key={p}
                  className="mpw-volume-preset michie-text-primary"
                  onClick={() => setVolume(presetValue)}
                  title={`${Math.round(p * 100)}%`}
                  aria-label={`Set volume ${Math.round(p * 100)}%`}
                >
                  {Math.round(p * 100)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {dragPos && (
        <div
          className="mpw-volume-tooltip"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          {Math.round(fillPercent)}%
        </div>
      )}

      <style>{`
        .mpw-volume {
          position: relative;
        }

        .mpw-volume-popover {
          position: absolute;
          right: 0;
          width: 44px;
          padding: 10px 0 12px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 20;
        }
        .mpw-volume-popover--down {
          top: calc(100% + 8px);
        }
        .mpw-volume-popover--up {
          bottom: calc(100% + 8px);
        }

        .mpw-volume-mute {
          width: 18px;
          height: 18px;
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mpw-volume-mute svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .mpw-volume-track {
          position: relative;
          width: 6px;
          height: 110px;
          border-radius: 999px;
          background: rgba(127, 127, 127, 0.25);
          cursor: pointer;
          touch-action: none;
        }
        .mpw-volume-track:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 4px;
        }

        .mpw-volume-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          border-radius: 999px;
        }

        .mpw-volume-thumb {
          position: absolute;
          left: 50%;
          width: 12px;
          height: 12px;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .mpw-volume-value {
          font-size: 0.65rem;
          opacity: 0.8;
          user-select: none;
        }

        .mpw-volume-presets {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }
        .mpw-volume-preset {
          border: none;
          background: none;
          padding: 1px 0;
          width: 30px;
          font-size: 0.6rem;
          line-height: 1;
          opacity: 0.65;
          cursor: pointer;
          border-radius: 6px;
          transition: opacity 0.15s ease, background-color 0.15s ease;
        }
        .mpw-volume-preset:hover,
        .mpw-volume-preset:focus-visible {
          opacity: 1;
          background: rgba(127, 127, 127, 0.15);
        }

        .mpw-volume-flash {
          position: absolute;
          right: 0;
          padding: 6px 10px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 15;
          pointer-events: none;
          animation: mpw-volume-flash-fade 0.9s ease forwards;
        }
        .mpw-volume-flash--down {
          top: calc(100% + 8px);
        }
        .mpw-volume-flash--up {
          bottom: calc(100% + 8px);
        }
        .mpw-volume-flash-icon {
          width: 14px;
          height: 14px;
          display: flex;
        }
        .mpw-volume-flash-icon svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .mpw-volume-flash-value {
          font-size: 0.7rem;
          white-space: nowrap;
        }
        @keyframes mpw-volume-flash-fade {
          0% { opacity: 0; transform: translateY(-2px); }
          15% { opacity: 1; transform: translateY(0); }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }

        .mpw-volume-tooltip {
          position: fixed;
          transform: translate(-115%, -50%);
          background: rgba(20, 20, 20, 0.85);
          color: #fff;
          font-size: 0.7rem;
          padding: 3px 7px;
          border-radius: 6px;
          pointer-events: none;
          z-index: 30;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}