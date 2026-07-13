import { useRef, useState } from "react";
import { useWidgetMediaStore } from "../../stores/widgetMediaStore";
import {
  pickAndSaveWidgetMedia,
  widgetMediaAssetUrl,
} from "../../services/widgetMediaService";

// Widget video custom. Kontrol play/pause CUMA lewat klik di video itu
// sendiri (tanpa tombol tambahan), independen dari status lagu — sengaja
// beda dari GifWidget yang otomatis ikut playback. Video di-mute default
// (asumsi: video ini dekorasi visual yang jalan bareng lagu, audio videonya
// sendiri kalau nyala bakal tabrakan sama musik yang lagi diputar).
// Ganti video tetap butuh cara terpisah dari klik play/pause, jadi dipakai
// tombol bulat kecil di pojok pas hover, sama seperti PhotoWidget/GifWidget.
export default function VideoWidget() {
  const videoPath = useWidgetMediaStore((s) => s.videoPath);
  const setMediaPath = useWidgetMediaStore((s) => s.setMediaPath);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const handlePick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPicking) return;
    setIsPicking(true);
    try {
      const saved = await pickAndSaveWidgetMedia("video");
      if (saved) setMediaPath("video", saved);
    } finally {
      setIsPicking(false);
    }
  };

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={videoPath ? undefined : "michie-box michie-box--primary"}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: videoPath ? undefined : "14px",
        boxSizing: "border-box",
      }}
    >
      {videoPath ? (
        <video
          ref={videoRef}
          src={widgetMediaAssetUrl(videoPath)}
          loop
          muted
          playsInline
          onClick={handleTogglePlay}
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            cursor: "pointer",
          }}
        />
      ) : (
        <button
          onClick={handlePick}
          disabled={isPicking}
          className="michie-text-secondary"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "none",
            cursor: isPicking ? "default" : "pointer",
            fontSize: "0.8rem",
            opacity: 0.75,
          }}
        >
          {isPicking ? "opening..." : "+ choose video"}
        </button>
      )}

      {/* Indikator kecil pas video paused, biar jelas klik bakal nge-play,
         bukan sekadar dekorasi statis. pointerEvents none supaya klik tetap
         tembus ke <video> di belakangnya. */}
      {videoPath && isPaused && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            className="michie-circle michie-circle--secondary michie-text-primary"
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            ▶
          </div>
        </div>
      )}

      {videoPath && isHovered && (
        <button
          onClick={handlePick}
          disabled={isPicking}
          title="Change video"
          aria-label="Change video"
          className="michie-circle michie-circle--secondary michie-text-primary"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "26px",
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            fontSize: "13px",
            lineHeight: 1,
            cursor: isPicking ? "default" : "pointer",
          }}
        >
          ✎
        </button>
      )}
    </div>
  );
}