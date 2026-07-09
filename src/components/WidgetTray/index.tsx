import React, { useRef } from "react";
import { widgetRegistry } from "../../config/widgetRegistry";
import { slotRegistry } from "../../config/slotRegistry";
import { TraySlotPreview } from "./TraySlotPreview";
import { LazyWidgetPreview } from "./LazyWidgetPreview";
import { WIDGET_DRAG_MIME } from "./dragConstants";

export { WIDGET_DRAG_MIME };

interface WidgetTrayProps {
  onClose: () => void;
}

export const WidgetTray: React.FC<WidgetTrayProps> = ({ onClose }) => {
  // Elemen drag-image custom yang lagi aktif, disimpan biar bisa di-cleanup
  // pas drag selesai (onDragEnd). Dibikin kecil supaya nggak nutupin
  // TraySlotPreview di belakangnya waktu kursor lewat di atasnya.
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    widgetId: string,
    label: string
  ) => {
    e.dataTransfer.setData(WIDGET_DRAG_MIME, widgetId);
    e.dataTransfer.effectAllowed = "copy";

    // Bikin drag-image kecil sendiri (bukan snapshot tile gede yang isinya
    // preview widget), soalnya default drag-image = ukuran elemen draggable
    // itu sendiri dan itu bakal nutupin TraySlotPreview pas di-drag di atasnya.
    // Pakai className michie-box biar tampilannya ikut tema aplikasi, bukan
    // warna hardcoded.
    const dragEl = document.createElement("div");
    dragEl.textContent = label;
    dragEl.className = "michie-box michie-box--primary michie-text-secondary";
    dragEl.style.position = "fixed";
    dragEl.style.top = "-9999px";
    dragEl.style.left = "-9999px";
    dragEl.style.padding = "8px 14px";
    dragEl.style.fontSize = "0.8rem";
    dragEl.style.fontWeight = "600";
    dragEl.style.whiteSpace = "nowrap";
    dragEl.style.pointerEvents = "none";
    dragEl.style.boxSizing = "border-box";
    document.body.appendChild(dragEl);
    dragPreviewRef.current = dragEl;

    e.dataTransfer.setDragImage(
      dragEl,
      dragEl.offsetWidth / 2,
      dragEl.offsetHeight / 2
    );
  };

  const handleDragEnd = () => {
    if (dragPreviewRef.current) {
      dragPreviewRef.current.remove();
      dragPreviewRef.current = null;
    }
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
            current layout, drop one of those
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
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gridAutoRows: "150px",
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
              no featured widget yet
            </span>
          )}

          {widgetRegistry.map((w) => {
            const WidgetComponent = w.component;
            return (
              <div
                key={w.id}
                draggable
                onDragStart={(e) => handleDragStart(e, w.id, w.label)}
                onDragEnd={handleDragEnd}
                className="michie-box michie-box--primary michie-text-secondary"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "14px",
                  cursor: "grab",
                  userSelect: "none",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
                title={`Drag "${w.label}" to one of box above`}
              >
                {/* Area preview: render komponen widget asli, di-scale supaya
                   muat di tile kecil. pointerEvents none biar interaksi
                   internal widget (kalau ada) nggak nyolong event drag. */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <LazyWidgetPreview component={WidgetComponent} />
                </div>

                <span
                  className="michie-text-secondary"
                  style={{
                    fontSize: "0.72rem",
                    textAlign: "center",
                    padding: "6px 8px",
                    opacity: 0.85,
                    flexShrink: 0,
                  }}
                >
                  {w.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};