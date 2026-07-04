import WidgetSlot from "./WidgetSlot.tsx";

export default function LeftColumn() {
    return (
        <div className="column left-column">
            <WidgetSlot title="Left Top" />
            <WidgetSlot title="Left Bottom" />
        </div>
    );
}