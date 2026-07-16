import React, { useEffect, useState } from "react";
import { settingsRegistry } from "./SettingsRegistry";

// Breakpoint window "sempit". Ini ngukur lebar viewport app, bukan cuma HP —
// jadi kalau window app di-resize kecil di desktop pun tetap kepicu.
const NARROW_BREAKPOINT = 700;

function useIsNarrow(breakpoint: number) {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isNarrow;
}

interface SettingsCenterProps {
  onClose: () => void;
}

export const SettingsCenter: React.FC<SettingsCenterProps> = ({ onClose }) => {
  const [activeId, setActiveId] = useState(settingsRegistry[0]?.id ?? "");
  const isNarrow = useIsNarrow(NARROW_BREAKPOINT);

  // Di window sempit, dua slot (konten & menu) gak muat berdampingan tanpa
  // salah satunya ke-squeeze. Jadi kita drill-down: tampilkan satu slot
  // penuh dalam satu waktu, "list" = daftar menu, "content" = panel aktif.
  const [mobileView, setMobileView] = useState<"list" | "content">("list");

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSelect = (id: string) => {
    setActiveId(id);
    if (isNarrow) setMobileView("content");
  };

  const ActivePanel = settingsRegistry.find(
    (s) => s.id === activeId,
  )?.component;

  // Di layar lebar, dua-duanya selalu tampil (perilaku lama, gak berubah).
  // Di layar sempit, cuma satu yang tampil sesuai mobileView.
  const showLeft = !isNarrow || mobileView === "content";
  const showRight = !isNarrow || mobileView === "list";

  return (
    <div
      data-aos="fade-right"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "5vh 5vw",
        boxSizing: "border-box",
      }}
    >
      <div
        className="michie-box michie-box--secondary"
        style={{
          width: "90vw",
          height: "90vh",
          display: isNarrow ? "flex" : "grid",
          flexDirection: isNarrow ? "column" : undefined,
          gridTemplateColumns: isNarrow
            ? undefined
            : "minmax(0, 1.4fr) minmax(280px, 1fr)",
          color: "#fff",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* === SLOT KIRI: KONTEN SETTING AKTIF === */}
        {showLeft && (
          <div
            className="michie-box--primary"
            style={{
              padding: isNarrow ? "24px" : "40px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              boxSizing: "border-box",
              overflowY: "auto",
            }}
          >
            {isNarrow && (
              <button
                className="michie-box michie-box--primary michie-text-secondary"
                onClick={() => setMobileView("list")}
                style={{
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  marginBottom: "16px",
                  flexShrink: 0,
                }}
              >
                ← back
              </button>
            )}
            {ActivePanel ? (
              <ActivePanel />
            ) : (
              <>
                <h2
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "2.2rem",
                    fontWeight: 600,
                  }}
                >
                  System settings
                </h2>
                <p
                  style={{
                    margin: 0,
                    opacity: 0.8,
                    fontSize: "1rem",
                    lineHeight: "1.6",
                    maxWidth: "480px",
                  }}
                >
                  Adjust the audio preferences, music directory source, and
                  interface appearance of your Michie app here.
                </p>
              </>
            )}
          </div>
        )}

        {/* === SLOT KANAN: NAVIGASI MENU === */}
        {showRight && (
          <div
            className="michie-box michie-box--secondary"
            style={{
              padding: isNarrow ? "24px" : "40px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              height: "100%",
              boxSizing: "border-box",
              overflowY: "auto",
            }}
          >
            {settingsRegistry.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  className="michie-box michie-box--primary michie-text-secondary"
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{
                    border: "none",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "1rem",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              );
            })}

            <div style={{ flex: 1 }} />

            <button
              className="michie-box michie-box--primary michie-text-secondary"
              onClick={onClose}
              style={{
                border: "none",
                padding: "16px",
                borderRadius: "14px",
                fontSize: "1rem",
                cursor: "pointer",
                opacity: 0.8,
              }}
            >
              close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};