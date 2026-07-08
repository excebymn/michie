import { useState, type DragEvent } from "react";
import { useWidgetLayoutStore } from "../../stores/widgetLayoutStore";
import { widgetRegistry } from "../../config/widgetRegistry";
import type { SlotConfig } from "../../config/slotRegistry";
import { WIDGET_DRAG_MIME } from "./dragConstants";

interface TraySlotPreviewProps {
  slot: SlotConfig;
}

export function TraySlotPreview({ slot }: TraySlotPreviewProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const widgetId = useWidgetLayoutStore((s) => s.slots[slot.id] ?? null);
  const assignWidget = useWidgetLayoutStore((s) => s.assignWidget);
  const clearSlot = useWidgetLayoutStore((s) => s.clearSlot);

  const widget = widgetRegistry.find((w) => w.id === widgetId);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedWidgetId = e.dataTransfer.getData(WIDGET_DRAG_MIME);
    if (draggedWidgetId) {
      assignWidget(slot.id, draggedWidgetId);
    }
  };

  return (
    <div className="michie-box michie-box--primary " style={{padding : "20px"}}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={
          "michie-box michie-box--secondary" +
          (isDragOver ? " tray-slot-preview--drag-over" : "")
        }
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "170px",
          height: "110px",
          borderRadius: "14px",
          boxSizing: "border-box",
          padding: "30px",
          flexShrink: 0,
        }}
        title={
          widget
            ? `${slot.label}: ${widget.label} (drop widget lain buat ganti)`
            : `${slot.label}: kosong — drop widget di sini`
        }
      >
        <span
          className="michie-text-secondary"
          style={{ fontSize: "0.72rem", opacity: 0.6, letterSpacing: "0.02em" }}
        >
          {slot.label}
        </span>
        <span
          className="michie-text-primary"
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {widget ? widget.label : "Kosong"}
        </span>

        {widget && (
          <button
            className="michie-circle michie-circle--secondary michie-text-primary"
            onClick={() => clearSlot(slot.id)}
            title="Lepas widget dari slot ini"
            aria-label="Lepas widget dari slot ini"
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              fontSize: "13px",
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </div>
      <style>{`
        .tray-slot-preview--drag-over {
          opacity: 0.75;
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
}
