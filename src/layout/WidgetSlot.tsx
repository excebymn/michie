import { useState, type DragEvent } from "react";
import { useWidgetLayoutStore } from "../stores/widgetLayoutStore";
import { widgetRegistry } from "../config/widgetRegistry";
import { WIDGET_DRAG_MIME } from "../components/WidgetTray";

type Props = {
  slotId: string;
};

export default function WidgetSlot({ slotId }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const widgetId = useWidgetLayoutStore((s) => s.slots[slotId] ?? null);
  const assignWidget = useWidgetLayoutStore((s) => s.assignWidget);
  const clearSlot = useWidgetLayoutStore((s) => s.clearSlot);

  const widget = widgetRegistry.find((w) => w.id === widgetId);
  const WidgetComponent = widget?.component;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    // wajib preventDefault supaya onDrop kebaca browser
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
      assignWidget(slotId, draggedWidgetId);
    }
  };

  return (
    <div
      className={
        "widget-slot michie-box michie-box--primary" +
        (isDragOver ? " widget-slot--drag-over" : "")
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {WidgetComponent ? (
        <div className="widget-slot-filled">
          <button
            className="widget-slot-remove michie-circle michie-circle--secondary michie-text-primary"
            onClick={() => clearSlot(slotId)}
            title="Lepas widget dari slot"
            aria-label="Lepas widget dari slot"
          >
            ×
          </button>
          <div className="widget-slot-content">
            <WidgetComponent />
          </div>
        </div>
      ) : (
        <span className="widget-slot-empty michie-text-secondary">
          Drop widget di sini
        </span>
      )}

      <style>{`
        .widget-slot-filled {
          position: relative;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .widget-slot-content {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .widget-slot-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          z-index: 1;
        }
        .widget-slot-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 0.85rem;
          opacity: 0.55;
          text-align: center;
          padding: 8px;
          box-sizing: border-box;
          pointer-events: none;
        }
        .widget-slot--drag-over {
          opacity: 0.85;
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}