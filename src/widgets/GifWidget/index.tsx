import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useWidgetMediaStore } from "../../stores/widgetMediaStore";
import {
  pickAndSaveWidgetMedia,
  widgetMediaAssetUrl,
} from "../../services/widgetMediaService";
import { decodeGifFromUrl, type DecodedGif } from "./gifDecoder";

// Widget GIF custom yang JALAN pas lagu diputer, BERHENTI (freeze di frame
// terakhir, bukan reset ke frame awal) pas lagu berhenti/pause — sinkron ke
// `isPlaying` dari playerStore, sama sekali gak ada kontrol manual di
// widget ini sendiri. Ganti gif lewat tombol bulat kecil pas hover (sama
// konvensi kayak PhotoWidget/VideoWidget).
export default function GifWidget() {
  const gifPath = useWidgetMediaStore((s) => s.gifPath);
  const setMediaPath = useWidgetMediaStore((s) => s.setMediaPath);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const gifRef = useRef<DecodedGif | null>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [decodedTick, setDecodedTick] = useState(0); // naik tiap decode baru selesai, buat re-trigger loop effect
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const drawFrame = (index: number) => {
    const gif = gifRef.current;
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!gif || !canvas || !off) return;
    const frame = gif.frames[index];
    if (!frame) return;

    const offCtx = off.getContext("2d");
    const ctx = canvas.getContext("2d");
    if (!offCtx || !ctx) return;

    // disposalType 2 = area frame sebelumnya wajib dibersihin ke transparan
    // dulu sebelum nggambar frame ini (umum dipakai gif ber-frame kecil di
    // atas background yang gak berubah)
    if (frame.disposalType === 2) {
      offCtx.clearRect(
        frame.dims.left,
        frame.dims.top,
        frame.dims.width,
        frame.dims.height,
      );
    }
    offCtx.putImageData(frame.imageData, frame.dims.left, frame.dims.top);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0);
  };

  // Decode ulang tiap gifPath ganti. GIF baru = mulai dari frame 0 (ini beda
  // kasus dari pause/resume lagu — bukan "nerusin" gif lama).
  useEffect(() => {
    let cancelled = false;
    gifRef.current = null;
    frameIndexRef.current = 0;

    if (!gifPath) return;

    setIsLoading(true);
    decodeGifFromUrl(widgetMediaAssetUrl(gifPath))
      .then((decoded) => {
        if (cancelled) return;
        gifRef.current = decoded;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = decoded.width;
          canvas.height = decoded.height;
        }
        const off = document.createElement("canvas");
        off.width = decoded.width;
        off.height = decoded.height;
        offscreenRef.current = off;
        drawFrame(0);
        setIsLoading(false);
        setDecodedTick((t) => t + 1);
      })
      .catch((err) => {
        console.error("GifWidget: gagal decode GIF:", err);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gifPath]);

  // Loop animasi, gated sepenuhnya oleh isPlaying. Berhenti = cancel rAF TANPA
  // reset frameIndexRef, jadi pas isPlaying balik true animasinya nerusin
  // dari frame terakhir, bukan restart dari awal.
  useEffect(() => {
    if (!isPlaying || !gifRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    let cancelled = false;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const gif = gifRef.current;
      if (!gif) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const currentFrame = gif.frames[frameIndexRef.current];
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed >= currentFrame.delay) {
        frameIndexRef.current = (frameIndexRef.current + 1) % gif.frames.length;
        drawFrame(frameIndexRef.current);
        lastFrameTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, decodedTick]);

  const handlePick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPicking) return;
    setIsPicking(true);
    try {
      const saved = await pickAndSaveWidgetMedia("gif");
      if (saved) setMediaPath("gif", saved);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={gifPath ? undefined : "michie-box michie-box--primary"}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: gifPath ? undefined : "14px",
        boxSizing: "border-box",
      }}
    >
      {gifPath ? (
        <canvas
          ref={canvasRef}
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
          {isPicking ? "membuka..." : "+ pilih gif"}
        </button>
      )}

      {gifPath && isLoading && (
        <div
          className="michie-text-secondary"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.72rem",
            opacity: 0.6,
          }}
        >
          decoding...
        </div>
      )}

      {gifPath && isHovered && (
        <button
          onClick={handlePick}
          disabled={isPicking}
          title="Ganti gif"
          aria-label="Ganti gif"
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