import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useWindowModeStore } from "../../stores/windowModeStore";
import {
  IconWindowDots,
  IconMinimize,
  IconMaximize,
  IconRestore,
  IconClose,
  IconPin,
  IconFullscreen,
  IconCompactMode,
  IconMiniPlayer,
} from "./Icons";

const appWindow = getCurrentWindow();

type WCItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  soon?: boolean;
};

export function WindowControls() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const compactMode = useWindowModeStore((s) => s.compactMode);
  const toggleCompactMode = useWindowModeStore((s) => s.toggleCompactMode);
  const toggleMiniPlayerMode = useWindowModeStore(
    (s) => s.toggleMiniPlayerMode,
  );

  // Sinkron status maximize/fullscreen — termasuk kalau berubah dari luar
  // (drag ke edge layar, shortcut OS, dsb), bukan cuma dari tombol ini.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
        setIsFullscreen(await appWindow.isFullscreen());
      } catch {
        // no-op — misal dijalankan di luar runtime Tauri (preview browser)
      }
      unlisten = await appWindow.onResized(async () => {
        try {
          setIsMaximized(await appWindow.isMaximized());
        } catch {
          // ignore
        }
      });
    })();
    return () => unlisten?.();
  }, []);

  // Reposisi anchor kalau window di-resize selagi menu terbuka, biar
  // tombol arc tidak "nyangkut" di posisi lama.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    };
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open]);

  // Klik di luar (trigger MAUPUN portal) / Escape menutup menu
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideTrigger && !insidePortal) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    }
    setOpen((v) => !v);
  };

  const items: WCItem[] = [
    {
      id: "minimize",
      label: "Minimize",
      icon: <IconMinimize />,
      onClick: () => appWindow.minimize(),
    },
    {
      id: "maximize",
      label: isMaximized ? "Restore" : "Maximize",
      icon: isMaximized ? <IconRestore /> : <IconMaximize />,
      onClick: async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
      },
    },
    {
      id: "always-on-top",
      label: isAlwaysOnTop ? "Lepas Always on Top" : "Always on Top",
      icon: <IconPin />,
      active: isAlwaysOnTop,
      onClick: async () => {
        const next = !isAlwaysOnTop;
        await appWindow.setAlwaysOnTop(next);
        setIsAlwaysOnTop(next);
      },
    },
    {
      id: "fullscreen",
      label: isFullscreen ? "Keluar Fullscreen" : "Fullscreen",
      icon: <IconFullscreen active={isFullscreen} />,
      active: isFullscreen,
      onClick: async () => {
        const next = !isFullscreen;
        await appWindow.setFullscreen(next);
        setIsFullscreen(next);
      },
    },
    {
      id: "compact",
      label: compactMode ? "Keluar Compact Mode" : "Compact Mode",
      icon: <IconCompactMode active={compactMode} />,
      active: compactMode,
      onClick: () => toggleCompactMode(),
    },
    {
      id: "mini-player",
      label: "Mini Player (segera hadir)",
      icon: <IconMiniPlayer />,
      soon: true,
      onClick: () => toggleMiniPlayerMode(), // baru toggle flag, lihat komentar di store
    },
    {
      id: "close",
      label: "Close",
      icon: <IconClose />,
      danger: true,
      onClick: () => appWindow.close(),
    },
  ];

  const total = items.length;
  // Kuadran aman: cuma mekar ke bawah & bawah-kiri (90°–180°, koordinat
  // layar 0°=kanan, 90°=bawah). Tidak pernah ke atas/kanan supaya nggak
  // kepotong tepi layar atau numpuk sama tombol grid/menu di sebelahnya.
  const angleStart = 95;
  const angleEnd = 175;
  const radius = 132;

  return (
    <>
      <button
        ref={triggerRef}
        className={
          "mpw-btn-menu michie-circle michie-circle--secondary mpw-wc-trigger" +
          (open ? " mpw-wc-trigger--open" : "")
        }
        onClick={handleToggle}
        title="Window Controls"
        aria-label="Buka kontrol jendela"
        aria-expanded={open}
      >
        <span className="mpw-icon-menu michie-text-primary">
          <IconWindowDots />
        </span>
      </button>

      {anchor &&
        createPortal(
          <div
            ref={portalRef}
            className={"mpw-wc-portal" + (open ? " mpw-wc-portal--open" : "")}
            style={{ left: anchor.x, top: anchor.y }}
          >
            {items.map((item, i) => {
              const t = total === 1 ? 0 : i / (total - 1);
              const angleDeg = angleStart + (angleEnd - angleStart) * t;
              const rad = (angleDeg * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <button
                  key={item.id}
                  className={
                    "mpw-wc-item michie-circle michie-circle--secondary" +
                    (item.active ? " mpw-wc-item--active" : "") +
                    (item.danger ? " mpw-wc-item--danger" : "") +
                    (item.soon ? " mpw-wc-item--soon" : "")
                  }
                  style={
                    {
                      transitionDelay: open
                        ? `${i * 28}ms`
                        : `${(total - i) * 16}ms`,
                      "--wc-x": `${x}px`,
                      "--wc-y": `${y}px`,
                    } as React.CSSProperties
                  }
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                >
                  <span className="mpw-icon-menu michie-text-primary">
                    {item.icon}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      <style>{`
        .mpw-wc-trigger svg { transition: transform 0.25s ease; }
        .mpw-wc-trigger--open svg { transform: rotate(90deg); }

        /* Portal: fixed relatif ke VIEWPORT (bukan .mpw-root), jadi tidak
           pernah kena overflow:hidden slot widget mana pun. */
        .mpw-wc-portal {
          position: fixed;
          width: 0;
          height: 0;
          z-index: 9999;
          pointer-events: none;
        }
        .mpw-wc-item {
          position: absolute;
          top: 0;
          left: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          transform: translate(-50%, -50%) scale(0.35);
          transition: transform 0.24s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease;
          pointer-events: none;
        }
        .mpw-wc-portal--open .mpw-wc-item {
          opacity: 1;
          transform: translate(calc(-50% + var(--wc-x)), calc(-50% + var(--wc-y))) scale(1);
          pointer-events: auto;
        }
        .mpw-wc-item--active { box-shadow: 0 0 0 2px currentColor inset, 0 2px 10px rgba(0,0,0,0.35); }
        .mpw-wc-item--danger:hover { color: #ff5c5c; }
        .mpw-wc-item--soon { position: absolute; }
        .mpw-wc-item--soon::after {
          content: "";
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.55;
        }
        .mpw-wc-item .mpw-icon-menu { width: 16px; height: 16px; }
        .mpw-wc-item .mpw-icon-menu svg { width: 100%; height: 100%; }
      `}</style>
    </>
  );
}