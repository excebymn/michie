import React from "react";
import { widgetRegistry } from "../../config/widgetRegistry";
import { slotRegistry } from "../../config/slotRegistry";
import { TraySlotPreview } from "./TraySlotPreview";
import { WIDGET_DRAG_MIME } from "./dragConstants";

export { WIDGET_DRAG_MIME };

interface WidgetTrayProps {
  onClose: () => void;
}

export const WidgetTray: React.FC<WidgetTrayProps> = ({ onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
    e.dataTransfer.setData(WIDGET_DRAG_MIME, widgetId);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
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
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: "hidden",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2
            className="michie-text-primary"
            style={{ margin: 0, fontSize: "2.2rem", fontWeight: 600 }}
          >
            Widget Tray
          </h2>
          <button
            className="michie-box michie-box--primary michie-text-secondary"
            onClick={onClose}
            style={{
              border: "none",
              padding: "10px 18px",
              borderRadius: "14px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            close
          </button>
        </div>

        {/* Preview slot ada DI DALAM modal ini biar drag-drop nggak perlu
           nembus ke slot asli di belakang overlay — lebih aman lintas WebView
           (Windows/macOS/Linux) karena drag & drop-nya tetap satu subtree DOM.
           Ini baca/tulis ke store yang sama dengan slot asli, jadi begitu
           di-drop di sini, slot kiri/kanan aplikasi ikut ke-update otomatis. */}
        <div style={{ marginBottom: "20px" }}>
          <span
            className="michie-text-secondary"
            style={{
              fontSize: "0.75rem",
              opacity: 0.7,
              display: "block",
              marginBottom: "8px",
            }}
          >
            Layout saat ini — drop widget di salah satu kotak ini
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {slotRegistry.map((slot) => (
              <TraySlotPreview key={slot.id} slot={slot} />
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gridAutoRows: "120px",
            gap: "16px",
            overflowY: "auto",
            alignContent: "start",
          }}
        >
          {widgetRegistry.length === 0 && (
            <span
              className="michie-text-secondary"
              style={{ opacity: 0.6, gridColumn: "1 / -1" }}
            >
              Belum ada widget tersedia.
            </span>
          )}

          {widgetRegistry.map((w) => (
            <div
              key={w.id}
              draggable
              onDragStart={(e) => handleDragStart(e, w.id)}
              className="michie-box michie-box--primary michie-text-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                borderRadius: "14px",
                cursor: "grab",
                userSelect: "none",
                padding: "16px",
                boxSizing: "border-box",
              }}
              title={`Drag "${w.label}" ke salah satu kotak slot di atas`}
            >
              {w.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};