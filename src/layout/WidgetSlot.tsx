type Props = {
    title: string;
};

export default function WidgetSlot({ title }: Props) {
    return (
        <div className="widget-slot michie-box michie-box--primary">
            <span>{title}</span>
        </div>
    );
}