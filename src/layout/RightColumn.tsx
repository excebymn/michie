import WidgetSlot from "./WidgetSlot.tsx";
import { slotRegistry } from "../config/slotRegistry";

export default function RightColumn() {
    const rightSlots = slotRegistry.filter((s) => s.id.startsWith("right-"));

    return (
        <div className="column right-column">
            {rightSlots.map((slot) => (
                <WidgetSlot key={slot.id} slotId={slot.id} />
            ))}
        </div>
    );
}