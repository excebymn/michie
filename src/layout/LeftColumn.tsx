import WidgetSlot from "./WidgetSlot.tsx";
import { slotRegistry } from "../config/slotRegistry";

export default function LeftColumn() {
    const leftSlots = slotRegistry.filter((s) => s.id.startsWith("left-"));

    return (
        <div className="column left-column">
            {leftSlots.map((slot) => (
                <WidgetSlot key={slot.id} slotId={slot.id} />
            ))}
        </div>
    );
}