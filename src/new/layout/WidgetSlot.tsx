type Props = {
    title: string;
};

export default function WidgetSlot({ title }: Props) {
    return (
        <div className="widget-slot">
            <span>{title}</span>
        </div>
    );
}