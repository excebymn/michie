import WidgetSlot from "./WidgetSlot.tsx";
import { slotRegistry } from "../config/slotRegistry";
import { useModeStore } from "../stores/modeStore";
import { LibraryView } from "../components/Library";

export default function RightColumn() {
  const isWorkMode = useModeStore((s) => s.mode === "work");

  if (isWorkMode) {
    return (
      <div className="column right-column">
        <div className="light-panel michie-box michie-box--primary">
          <LibraryView />
        </div>
      </div>
    );
  }

  const rightSlots = slotRegistry.filter((s) => s.id.startsWith("right-"));

  return (
    <div className="column right-column">
      {rightSlots.map((slot) => (
        <WidgetSlot key={slot.id} slotId={slot.id} />
      ))}
    </div>
  );
}