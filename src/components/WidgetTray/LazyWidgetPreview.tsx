import { useEffect, useRef, useState, type FC } from "react";

export type PreviewMode = "all" | "hover";

interface LazyWidgetPreviewProps {
  component: FC;
  mode: PreviewMode;
}

// Skeleton pulsing pas widget belum di-mount.
function PreviewPlaceholder() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="widget-preview-skeleton__pulse" />
      <style>{`
        .widget-preview-skeleton__pulse {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.12;
          animation: widget-preview-pulse 1.4s ease-in-out infinite;
        }
        @keyframes widget-preview-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.08; }
          50% { transform: scale(1); opacity: 0.22; }
        }
      `}</style>
    </div>
  );
}

// Dua mode:
// - "all": komponen widget di-mount begitu tile-nya kelihatan di viewport
//   (IntersectionObserver), dan di-unmount lagi kalau discroll keluar —
//   biar render loop/audio tap-nya ikut berhenti pas gak kelihatan.
// - "hover": TIDAK auto-mount sama sekali. Widget cuma jalan selama kursor
//   ada di atas tile-nya (dengan debounce kecil biar mouse yang numpang
//   lewat gak ikut trigger), jadi paling banyak cuma satu yang hidup dalam
//   satu waktu — paling ringan buat grid yang isinya banyak visualizer.
export function LazyWidgetPreview({ component: WidgetComponent, mode }: LazyWidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "all") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        rootMargin: "150px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    // Ganti mode -> reset state biar gak nyangkut (mis. pindah dari "all"
    // yang lagi visible ke "hover" tanpa kursor di atasnya).
    setIsVisible(false);
    setIsHovered(false);
  }, [mode]);

  const handleMouseEnter = () => {
    if (mode !== "hover") return;
    hoverTimerRef.current = setTimeout(() => setIsHovered(true), 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  const isMounted = mode === "all" ? isVisible : isHovered;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {!isMounted && <PreviewPlaceholder />}

      {isMounted && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "260%",
            height: "260%",
            transform: "translate(-50%, -50%) scale(0.38)",
            transformOrigin: "center",
          }}
        >
          <WidgetComponent />
        </div>
      )}
    </div>
  );
}