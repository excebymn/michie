// PlayerControls.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { appService } from "../../services/appService";
import type { Songs } from "../../globalValues";

function IconPlay() {
  return (
    <svg viewBox="0 0 640 640" fill="currentColor">
      <path d="M171.2,100.9c-12.4-6.8-27.4-6.5-39.6,0.7S112,121.9,112,136v368c0,14.1,7.5,27.2,19.6,34.4s27.2,7.5,39.6,0.7l336-184c12.8-7,20.8-20.5,20.8-35.1s-8-28.1-20.8-35.1L171.2,100.9z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 640 640" fill="currentColor">
      <path d="M176,96c-26.5,0-48,21.5-48,48v352c0,26.5,21.5,48,48,48h64c26.5,0,48-21.5,48-48V144c0-26.5-21.5-48-48-48H176z M400,96c-26.5,0-48,21.5-48,48v352c0,26.5,21.5,48,48,48h64c26.5,0,48-21.5,48-48V144c0-26.5-21.5-48-48-48H400z" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 640 640" fill="currentColor">
      <path d="M467.8,98.4c12-5,25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64c-9.2,9.2-22.9,11.9-34.9,6.9S448,268.9,448,256v-32h-32c-10.1,0-19.6,4.7-25.6,12.8L358,280l-40-53.3l21.2-28.3c18.1-24.2,46.6-38.4,76.8-38.4h32v-32C448,115.1,455.8,103.4,467.8,98.4z M218,360l40,53.3l-21.2,28.3C218.7,465.8,190.2,480,160,480H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c10.1,0,19.6-4.7,25.6-12.8L218,360z M502.6,534.6c-9.2,9.2-22.9,11.9-34.9,6.9S448,524.9,448,512v-32h-32c-30.2,0-58.7-14.2-76.8-38.4L185.6,236.8c-6-8.1-15.5-12.8-25.6-12.8H96c-17.7,0-32-14.3-32-32s14.3-32,32-32h64c30.2,0,58.7,14.2,76.8,38.4l153.6,204.8c6,8.1,15.5,12.8,25.6,12.8h32v-32c0-12.9,7.8-24.6,19.8-29.6s25.7-2.2,34.9,6.9l64,64c6,6,9.4,14.1,9.4,22.6s-3.4,16.6-9.4,22.6l-64,64L502.6,534.6z" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 640 640" fill="currentColor">
      <path d="M534.6,182.6c12.5-12.5,12.5-32.8,0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S416,83.1,416,96v32H256c-106,0-192,86-192,192c0,17.7,14.3,32,32,32s32-14.3,32-32c0-70.7,57.3-128,128-128h160v32c0,12.9,7.8,24.6,19.8,29.6s25.7,2.2,34.9-6.9l64-64L534.6,182.6z M105.4,457.4c-12.5,12.5-12.5,32.8,0,45.3l64,64c9.2,9.2,22.9,11.9,34.9,6.9S224,556.9,224,544v-32h160c106,0,192-86,192-192c0-17.7-14.3-32-32-32s-32,14.3-32,32c0,70.7-57.3,128-128,128H224v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9,6.9l-64,64L105.4,457.4z" />
    </svg>
  );
}

function IconPrevious() {
  return (
    <svg viewBox="0 0 810 810" fill="currentColor">
      <path d="M 593.42 682.35 C 609.1 690.95 628.08 690.57 643.52 681.46 C 658.95 672.36 668.31 655.79 668.31 637.95 L 668.31 172.39 C 668.31 154.55 658.82 137.98 643.52 128.88 C 628.21 119.77 609.1 119.39 593.42 127.99 L 168.34 360.77 C 152.15 369.62 142.03 386.7 142.03 405.17 C 142.03 423.64 152.15 440.72 168.34 449.57 Z" />
      <rect x="23.96" y="120.04" width="107.46" height="569.6" rx="53.73" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 810 810" fill="currentColor">
      <path d="M 216.58 127.65 C 200.9 119.05 181.92 119.43 166.48 128.54 C 151.05 137.64 141.69 154.21 141.69 172.05 L 141.69 637.61 C 141.69 655.45 151.18 672.02 166.48 681.13 C 181.79 690.23 200.9 690.61 216.58 682.01 L 641.66 449.23 C 657.85 440.38 667.97 423.3 667.97 404.83 C 667.97 386.36 657.85 369.28 641.66 360.43 Z" />
      <rect x="678.58" y="120.36" width="107.46" height="569.6" rx="53.73" />
    </svg>
  );
}

// Sengaja dibuat lokal (bukan import dari ./Icons) supaya konsisten dengan
// icon-icon lain di file ini yang juga didefinisikan lokal, bukan di-share.
function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.1 21.35c-.18.1-.38.15-.6.15s-.42-.05-.6-.15C6.5 18.36 2 14.86 2 9.86 2 6.6 4.6 4 7.8 4c1.85 0 3.5.9 4.2 2.3C12.7 4.9 14.35 4 16.2 4 19.4 4 22 6.6 22 9.86c0 5-4.5 8.5-9.9 11.49Z" />
    </svg>
  );
}

// Format label kecil "FLAC · 44.1kHz · 1411kbps" dari metadata teknis lagu.
// Field sample_rate/bit_rate/format masih opsional karena backend belum
// mengirimnya — begitu backend sudah kirim, badge ini otomatis terisi tanpa
// perubahan lagi di sini. Selama belum ada datanya, tampil "—" (placeholder)
// supaya lebar kolom kanan tetap konsisten dan layout tidak "kedut".
function formatAudioInfo(song: Songs | null): string {
  if (!song) return "—";
  const parts: string[] = [];
  const fmt = (song as Songs & { format?: string }).format;
  const sampleRate = (song as Songs & { sample_rate?: number }).sample_rate;
  const bitRate = (song as Songs & { bit_rate?: number }).bit_rate;

  if (fmt) parts.push(fmt.toUpperCase());
  if (sampleRate) {
    const khz = sampleRate / 1000;
    parts.push(`${khz % 1 === 0 ? khz : khz.toFixed(1)}kHz`);
  }
  if (bitRate) parts.push(`${Math.round(bitRate)}kbps`);

  return parts.length ? parts.join(" · ") : "—";
}

// Badge marquee: teks statis kalau muat di lebar kolom kanan, otomatis geser
// bolak-balik kalau kepanjangan. Diukur pakai ResizeObserver supaya re-check
// tiap kali lebar sidebar berubah atau lagu ganti (label beda panjang).
function FormatBadge({ song }: { song: Songs | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowAmount, setOverflowAmount] = useState(0);
  const label = formatAudioInfo(song);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const measure = () => {
      const diff = text.scrollWidth - container.clientWidth;
      setOverflowAmount(diff > 4 ? diff : 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [label]);

  return (
    <div
      className="mpw-format-badge"
      ref={containerRef}
      title="Format and quality of the audio file currently playing"
    >
      <span
        ref={textRef}
        className={
          overflowAmount > 0
            ? "mpw-format-badge__text mpw-format-badge__text--marquee"
            : "mpw-format-badge__text"
        }
        style={
          overflowAmount > 0
            ? ({ "--scroll-distance": `${overflowAmount}px` } as React.CSSProperties)
            : undefined
        }
      >
        {label}
      </span>
    </div>
  );
}

export function PlayerControls() {
  const {
    isPlaying,
    isLoaded,
    isShuffle,
    repeatMode,
    currentSong,
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
    await setRepeatMode((repeatMode + 1) % 3);
  }, [repeatMode, setRepeatMode]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentSong) return;
    appService.toggleFavorite(currentSong.path);
    // Tidak perlu setState manual di sini — event `song-favorited-changed`
    // dari backend akan di-patch balik ke currentSong lewat listener
    // terpusat di MainPlayer/index.tsx (lihat konvensi #3 project context).
  }, [currentSong]);

  return (
    <>
      {/*
        Convention:
        - Root container (.mpw-controls) is NOT wrapped by a colored button/circle,
          so it uses --secondary directly for all its icons (shuffle, previous, next, repeat).
        - The play/pause button IS wrapped in a `michie-circle--secondary` circle,
          so its icon needs --primary for contrast against that secondary background.
        - Row dibagi 3 kolom (like | transport | info format) memakai flex:1 di
          kolom kiri & kanan supaya cluster transport tetap presisi di tengah,
          apa pun isi kolom kiri/kanan.
      */}
      <div className="mpw-controls-row michie-text-secondary">
        <div className="mpw-side mpw-side--left">
          <button
            className={`mpw-btn-icon ${currentSong?.favorited ? "active" : ""}`}
            onClick={handleToggleFavorite}
            disabled={!currentSong}
            title="Favorite"
            aria-label="Favorite this song"
          >
            <span className="mpw-icon">
              <IconHeart filled={!!currentSong?.favorited} />
            </span>
          </button>
        </div>

        <div className="mpw-controls">
          {/* shuffle */}
          <button
            className={`mpw-btn-icon ${isShuffle ? "active" : ""}`}
            onClick={() => setShuffleMode()}
            title="Shuffle"
            aria-label="Shuffle"
          >
            <span className="mpw-icon">
              <IconShuffle />
            </span>
          </button>

          {/* previous */}
          <button
            className="mpw-btn-icon"
            onClick={() => previous()}
            disabled={!isLoaded}
            title="Previous"
            aria-label="Previous"
          >
            <span className="mpw-icon">
              <IconPrevious />
            </span>
          </button>

          {/* play / pause — inner icon overrides to primary for contrast on the secondary circle */}
          <button
            className="mpw-btn-play michie-circle michie-circle--secondary michie-border-primary"
            onClick={handlePlayPause}
            disabled={!isLoaded}
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span className="mpw-icon mpw-icon--play michie-text-primary">
              {isPlaying ? <IconPause /> : <IconPlay />}
            </span>
          </button>

          {/* next */}
          <button
            className="mpw-btn-icon"
            onClick={() => next()}
            disabled={!isLoaded}
            title="Next"
            aria-label="Next"
          >
            <span className="mpw-icon">
              <IconNext />
            </span>
          </button>

          {/* repeat */}
          <button
            className={`mpw-btn-icon ${repeatMode > 0 ? "active" : ""}`}
            onClick={cycleRepeat}
            title={["No repeat", "Repeat all", "Repeat one"][repeatMode]}
            aria-label="Repeat"
          >
            <span className="mpw-icon">
              <IconRepeat />
            </span>
            {repeatMode === 2 && <span className="mpw-repeat-badge">1</span>}
          </button>
        </div>

        <div className="mpw-side mpw-side--right">
          <FormatBadge song={currentSong} />
        </div>
      </div>

      <style>{`
        .mpw-controls-row {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 8px;
        }

        .mpw-side {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .mpw-side--left {
          justify-content: flex-start;
        }

        .mpw-side--right {
          justify-content: flex-end;
        }

        .mpw-format-badge {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          opacity: 0.55;
          overflow: hidden;
          max-width: 100%;
        }

        .mpw-format-badge__text {
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
        }

        .mpw-format-badge__text--marquee {
          animation: mpw-marquee 7s ease-in-out infinite;
        }

        @keyframes mpw-marquee {
          0%, 12% { transform: translateX(0); }
          50%, 62% { transform: translateX(calc(-1 * var(--scroll-distance))); }
          100% { transform: translateX(0); }
        }

        .mpw-controls {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .mpw-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .mpw-icon svg {
          width: 100%;
          height: 100%;
          display: block;
          fill: currentColor;
        }

        .mpw-icon--play {
          width: 30px;
          height: 30px;
        }

        .mpw-btn-icon {
          position: relative;
          background: none;
          border: none;
          padding: 10px;
          cursor: pointer;
          opacity: 0.55;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s, background 0.15s;
          color: inherit;
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
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.12s, opacity 0.15s;
          flex-shrink: 0;
          color: inherit;
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