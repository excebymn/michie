import React from "react";
import { ManualPanel } from "./index";

interface ManualPopupProps {
  onClose: () => void;
}

// Popup fullscreen berdiri sendiri (bukan panel di dalam SettingsCenter) —
// ini yang dimunculkan otomatis oleh App.tsx begitu user pertama kali install
// & buka app. Isi kontennya sama persis dengan panel "Manual" di
// SettingsCenter (ManualPanel), jadi progress section-nya tetap nyambung
// lewat useManualStore kalau user buka lagi dari Settings nanti.
export const ManualPopup: React.FC<ManualPopupProps> = ({ onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      data-aos="fade-right"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000, // di atas SettingsCenter (9999)
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
          width: "min(640px, 90vw)",
          maxHeight: "85vh",
          padding: "40px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <button
          className="michie-box michie-box--primary michie-text-secondary"
          onClick={onClose}
          aria-label="Tutup"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            border: "none",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ✕
        </button>
        <ManualPanel />
      </div>
    </div>
  );
};