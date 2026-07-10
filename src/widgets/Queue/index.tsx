import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { QueueControls } from "./QueueControls";
import { QueueRow } from "./QueueRow";
import { IconQueueEmpty } from "./Icons";

export function QueueView() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const refreshCurrentIndex = usePlayerStore((s) => s.refreshCurrentIndex);
  const jumpToQueueIndex = usePlayerStore((s) => s.jumpToQueueIndex);
  const removeFromQueueAt = usePlayerStore((s) => s.removeFromQueueAt);
  const reorderQueueItems = usePlayerStore((s) => s.reorderQueueItems);

  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    loadQueue();
    refreshCurrentIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDrop = (index: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;
    reorderQueueItems(from, index);
  };

  return (
    <div className="qv-root">

      <QueueControls />

      <div className="qv-list">
        {queue.length === 0 ? (
          <div className="qv-empty michie-text-secondary">
            <IconQueueEmpty />
            <p>The queue is still empty.</p>
          </div>
        ) : (
          queue.map((song, index) => (
            <QueueRow
              key={`${song.path}-${index}`}
              song={song}
              index={index}
              isCurrent={index === currentIndex}
              onPlay={() => jumpToQueueIndex(index)}
              onRemove={() => removeFromQueueAt(index)}
              onDragStartRow={() => handleDragStart(index)}
              onDropRow={() => handleDrop(index)}
            />
          ))
        )}
      </div>

      <style>{`
        .qv-root { display: flex; flex-direction: column; gap: 16px; height: 100%; min-height: 0; }
        .qv-title { font-size: 1.4rem; font-weight: 600; }
        .qv-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px; }
        .qv-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px 20px; opacity: 0.5; text-align: center; }
        .qv-empty svg { width: 40px; height: 40px; opacity: 0.6; }
        .qv-empty p { margin: 0; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}