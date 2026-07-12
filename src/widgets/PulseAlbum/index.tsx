import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { subscribeVisualizer } from "../../services/visualizerService";
import "./visualizer.css";

const BEAT_BAND_END = 8; // band 0..7 (bass + low-mid) sebagai sumber "denyut"
const MAX_EXTRA_SCALE = 0.28; // dikurangi dari 0.55 — album art butuh jangkauan
                              // scale lebih kecil biar gak keliatan "meledak"
                              // dan gampang crop di tepi slot

export default function PulseAlbum() {
  const blobRef = useRef<HTMLDivElement | null>(null);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    const unsubscribe = subscribeVisualizer((levels) => {
      const el = blobRef.current;
      if (!el) return;
      const slice = levels.slice(0, BEAT_BAND_END);
      const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
      const clamped = Math.max(0, Math.min(1, avg));
      el.style.transform = `scale(${1 + clamped * MAX_EXTRA_SCALE})`;
    });
    return unsubscribe;
  }, []);

  const coverUrl = currentSong?.cover
    ? `asset://localhost/${currentSong.cover}`
    : null;

  return (
    <div
      className="pulsing-blob speaker-texture"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // jaga-jaga: album art gak "bocor" keluar slot saat membesar
      }}
    >
      <div
        ref={blobRef}
        className="michie-circle michie-circle--primary pulsing-blob__circle"
        style={{ width: "42%", aspectRatio: "1", overflow: "hidden" }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={currentSong?.name ?? "Album art"}
            className="pulsing-blob__cover"
          />
        ) : null}
      </div>
    </div>
  );
}