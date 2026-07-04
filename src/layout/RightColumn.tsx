import WidgetSlot from "./WidgetSlot.tsx";

export default function RightColumn() {
    return (
        <div className="column right-column">
            <WidgetSlot title="Right Top" />
            <WidgetSlot title="Right Bottom" />
        </div>
    );
}