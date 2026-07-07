import React, { useState } from "react";
import { settingsRegistry } from "./SettingsRegristy";

interface SettingsCenterProps {
  onClose: () => void;
}

export const SettingsCenter: React.FC<SettingsCenterProps> = ({ onClose }) => {
  const [activeId, setActiveId] = useState(settingsRegistry[0]?.id ?? "");

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const ActivePanel = settingsRegistry.find(
    (s) => s.id === activeId,
  )?.component;

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
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)",
          color: "#fff",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* === SLOT KIRI: KONTEN SETTING AKTIF === */}
        <div
          className="michie-box--primary"
          style={{
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
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
                Pengaturan Sistem
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
                Sesuaikan preferensi audio, sumber direktori musik, dan tampilan
                antarmuka aplikasi Michie Anda di sini.
              </p>
            </>
          )}
        </div>

        {/* === SLOT KANAN: NAVIGASI MENU === */}
        <div
          className="michie-box michie-box--secondary"
          style={{
            padding: "40px",
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
                onClick={() => setActiveId(item.id)}
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
      </div>
    </div>
  );
};
