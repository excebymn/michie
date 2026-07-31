import WidgetSlot from "./WidgetSlot.tsx";
import { slotRegistry } from "../config/slotRegistry";
import { useModeStore } from "../stores/modeStore";
import { QueueView } from "../components/Queue";

export default function LeftColumn() {
  const isWorkMode = useModeStore((s) => s.mode === "work");

  if (isWorkMode) {
    return (
      <div className="column left-column">
        <div className="light-panel michie-box michie-box--primary">
          <QueueView />
        </div>
      </div>
    );
  }

  const leftSlots = slotRegistry.filter((s) => s.id.startsWith("left-"));

  return (
    <div className="column left-column">
      {leftSlots.map((slot) => (
        <WidgetSlot key={slot.id} slotId={slot.id} />
      ))}
    </div>
  );
}