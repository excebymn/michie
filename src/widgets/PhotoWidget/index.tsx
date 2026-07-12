import { useState } from "react";
import { useWidgetMediaStore } from "../../stores/widgetMediaStore";
import {
  pickAndSaveWidgetMedia,
  widgetMediaAssetUrl,
} from "../../services/widgetMediaService";

// Widget foto custom. Kosong -> tap area buat pilih foto. Sudah ada foto ->
// area utama cuma nampilin foto (gak ada aksi klik di situ, biar gak ketuker
// sama widget lain yang klik-nya berarti sesuatu), ganti foto lewat tombol
// bulat kecil di pojok yang muncul pas di-hover, sama persis konvensi tombol
// "x" di TraySlotPreview (michie-circle).
export default function PhotoWidget() {
  const photoPath = useWidgetMediaStore((s) => s.photoPath);
  const setMediaPath = useWidgetMediaStore((s) => s.setMediaPath);
  const [isHovered, setIsHovered] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const saved = await pickAndSaveWidgetMedia("photo");
      if (saved) setMediaPath("photo", saved);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={photoPath ? undefined : "michie-box michie-box--primary"}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: photoPath ? undefined : "14px",
        boxSizing: "border-box",
      }}
    >
      {photoPath ? (
        <img
          src={widgetMediaAssetUrl(photoPath)}
          alt="widget custom"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
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
          {isPicking ? "membuka..." : "+ pilih foto"}
        </button>
      )}

      {photoPath && isHovered && (
        <button
          onClick={handlePick}
          disabled={isPicking}
          title="Ganti foto"
          aria-label="Ganti foto"
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