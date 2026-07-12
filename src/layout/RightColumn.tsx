import WidgetSlot from "./WidgetSlot.tsx";
import { slotRegistry } from "../config/slotRegistry";
import { useLightModeStore } from "../stores/lightmodestore";
import { LibraryView } from "../components/Library";

export default function RightColumn() {
    const isLightMode = useLightModeStore((s) => s.isLightMode);

    if (isLightMode) {
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