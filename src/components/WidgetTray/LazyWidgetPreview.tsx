import { useEffect, useRef, useState, type FC } from "react";

interface LazyWidgetPreviewProps {
  component: FC;
}

// Cuma mount komponen widget asli kalau tile-nya lagi kelihatan di layar.
// Widget yang di-scroll keluar viewport otomatis di-unmount lagi, jadi
// render loop / interval / subscription di dalamnya ikut berhenti — bukan
// cuma "disembunyikan" doang. Ini yang bikin makin banyak widget di
// registry gak bikin tray makin berat pas dibuka.
export function LazyWidgetPreview({ component: WidgetComponent }: LazyWidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        // rootMargin positif = mulai mount sedikit sebelum tile bener-bener
        // masuk viewport, biar gak keliatan "pop-in" pas scroll pelan.
        rootMargin: "150px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
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
      {isVisible && <WidgetComponent />}
    </div>
  );
}