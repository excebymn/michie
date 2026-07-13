import { useEffect, useRef, useState } from "react";
import type { Songs } from "../../globalValues";
import { IconGrip, IconRemove, IconPlayingBars } from "./Icons";

interface QueueRowProps {
  song: Songs;
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDragStartRow: () => void;
  onDropRow: () => void;
}

const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    if (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

const lastUserScrollAt = new WeakMap<HTMLElement, number>();
const listenerAttached = new WeakSet<HTMLElement>();

function ensureUserScrollListener(container: HTMLElement) {
  if (listenerAttached.has(container)) return;
  listenerAttached.add(container);
  const markUserScroll = () => lastUserScrollAt.set(container, Date.now());
  container.addEventListener("wheel", markUserScroll, { passive: true });
  container.addEventListener("touchmove", markUserScroll, { passive: true });
}

const RESUME_AFTER_MS = 3000;

export function QueueRow({
  song,
  index,
  isCurrent,
  onPlay,
  onRemove,
  onDragStartRow,
  onDropRow,
}: QueueRowProps) {
  const [isOver, setIsOver] = useState(false);
  // State untuk melacak apakah baris ini sedang terlihat/mendekati viewport
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // 1. LAZY LOADING ENGINE (IntersectionObserver)
  useEffect(() => {
    // Lagu yang sedang diputar WAJIB selalu ter-render agar auto-scroll tidak pincang
    if (isCurrent) {
      setIsVisible(true);
      return;
    }

    const row = rowRef.current;
    if (!row) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        // rootMargin 200px berfungsi sebagai buffer zone (preload sebelum benar-benar tergulung ke layar)
        rootMargin: "200px 0px 200px 0px",
      }
    );

    observer.observe(row);

    return () => {
      observer.unobserve(row);
    };
  }, [isCurrent]);

  // 2. AUTO-SCROLL LOGIC (Tetap dipertahankan dari kode asli)
  useEffect(() => {
    if (!isCurrent) return;
    const row = rowRef.current;
    if (!row) return;

    const scrollParent = findScrollParent(row);
    if (scrollParent) ensureUserScrollListener(scrollParent);

    let cancelled = false;
    let timeoutId: number | undefined;

    const tryScroll = () => {
      if (cancelled) return;
      const lastScroll = scrollParent
        ? lastUserScrollAt.get(scrollParent) ?? 0
        : 0;
      const elapsed = Date.now() - lastScroll;

      if (elapsed >= RESUME_AFTER_MS) {
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        timeoutId = window.setTimeout(tryScroll, RESUME_AFTER_MS - elapsed);
      }
    };

    tryScroll();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isCurrent, song.path]);

  return (
    <div
      ref={rowRef}
      className={`qr-row ${isCurrent ? "qr-row--current" : ""} ${isOver ? "qr-row--over" : ""} ${!isVisible ? "qr-row--unrendered" : ""}`}
      onClick={isVisible ? onPlay : undefined}
      onDragOver={(e) => {
        if (!isVisible) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (!isVisible) return;
        e.preventDefault();
        setIsOver(false);
        onDropRow();
      }}
    >
      {isVisible ? (
        <>
          <span
            className="qr-grip michie-text-secondary"
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.effectAllowed = "move";
              onDragStartRow();
            }}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <IconGrip />
          </span>
          <span className="qr-index michie-text-secondary">
            {isCurrent ? <IconPlayingBars /> : index + 1}
          </span>
          <div className="qr-info">
            <div className="qr-title michie-text-secondary">{song.name}</div>
            <div className="qr-sub michie-text-secondary">
              {song.artist || song.album_artist || "—"}
            </div>
          </div>
          <span className="qr-duration michie-text-secondary">
            {formatDuration(song.duration)}
          </span>
          <button
            className="qr-remove michie-text-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={isCurrent}
            title={isCurrent ? "Currently playing" : "Remove from queue"}
            aria-label="Remove from queue"
          >
            <IconRemove />
          </button>
        </>
      ) : (
        /* Render angka index tipis saja sebagai penanda placeholder agar tidak mutasi tinggi layout */
        <span className="qr-index michie-text-secondary" style={{ gridColumn: "2", opacity: 0.15 }}>
          {index + 1}
        </span>
      )}
      <style>{`
        .qr-row {
          display: grid;
          grid-template-columns: 20px 24px 1fr 48px 28px;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          min-height: 43px; /* Mematok tinggi minimum baris agar scrollbar stabil saat swap konten */
          box-sizing: border-box;
        }
        .qr-row:hover:not(.qr-row--unrendered) { background: color-mix(in srgb, currentColor 6%, transparent); }
        .qr-row--current {
          font-weight: 600;
          background: color-mix(in srgb, currentColor 9%, transparent);
        }
        .qr-row--over { outline: 2px dashed currentColor; outline-offset: -2px; opacity: 0.85; }
        .qr-row--unrendered {
          cursor: default;
        }
        .qr-grip { opacity: 0.35; display: flex; cursor: grab; }
        .qr-grip svg { width: 14px; height: 14px; }
        .qr-index { font-size: 0.78rem; opacity: 0.5; text-align: center; display: flex; align-items: center; justify-content: center; }
        .qr-index svg { width: 14px; height: 14px; }
        .qr-info { overflow: hidden; }
        .qr-title { font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .qr-sub { font-size: 0.74rem; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .qr-duration { font-size: 0.76rem; opacity: 0.5; text-align: right; font-variant-numeric: tabular-nums; }
        .qr-remove {
          background: none; border: none; opacity: 0.4; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 4px; border-radius: 6px;
        }
        .qr-remove:hover:not(:disabled) { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
        .qr-remove:disabled { opacity: 0.15; cursor: default; }
        .qr-remove svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}