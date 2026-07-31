import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useModeStore } from "../../stores/modeStore";
import { videoService } from "../../services/videoService";
import type { VideoInfo } from "../../globalValues";
import { VideoLibraryPicker } from "./VideoLibraryPicker";
import { VideoControls } from "./VideoControls";
import { VideoMenu } from "./VideoMenu";
import { IconMenu } from "./Icons";

export function VideoPlayerMode() {
  const setMode = useModeStore((s) => s.setMode);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playablePath, setPlayablePath] = useState<string | null>(null);
  const [prepareStatus, setPrepareStatus] = useState
    "idle" | "preparing" | "error"
  >("idle");
  const [prepareProgress, setPrepareProgress] = useState<number | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleExit = () => {
    setMenuOpen(false);
    setMode("normal");
  };

  const handleChangeVideo = () => {
    setMenuOpen(false);
    setSelectedVideo(null);
    setPlayablePath(null);
    setPrepareStatus("idle");
    setPrepareError(null);
  };

  // Every time the user picks a new video: ask the backend to prepare a
  // playable path (the original file if it's already H.264/AAC-MP4, or a
  // transcoded/remuxed cache result otherwise). This request can resolve
  // instantly (video already compatible, or already cached) — the
  // "preparing" overlay only shows up when the backend is actually working.
  useEffect(() => {
    if (!selectedVideo) return;
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    setPrepareStatus("preparing");
    setPrepareProgress(null);
    setPrepareError(null);
    setPlayablePath(null);

    (async () => {
      cleanups.push(
        await videoService.onTranscodeProgress((e) => {
          if (e.payload.path === selectedVideo.path) {
            setPrepareProgress(e.payload.percent);
          }
        }),
      );

      try {
        const path = await videoService.prepareVideoPlayback(
          selectedVideo.path,
        );
        if (cancelled) return;
        setPlayablePath(path);
        setPrepareStatus("idle");
      } catch (err) {
        if (cancelled) return;
        console.error("[VideoPlayerMode] prepareVideoPlayback failed:", err);
        setPrepareError(String(err));
        setPrepareStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [selectedVideo]);

  // Autoplay-policy fix: WebKitGTK (Linux) and some WebView2 builds reject
  // autoplay for a video with an audio track unless the element is `muted`.
  // Start muted so autoplay always succeeds (playback never gets stuck on a
  // black screen), then try to unmute once the `playing` event actually
  // fires. If the browser still refuses to unmute (stricter policy), the
  // video keeps playing (just silent) instead of staying blank like before.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playablePath) return;

    const tryUnmute = () => {
      el.muted = false;
    };
    el.addEventListener("playing", tryUnmute, { once: true });

    el.play().catch((err) => {
      console.error(
        "[VideoPlayerMode] play() failed, staying muted:",
        err.name,
        err.message,
      );
    });

    return () => el.removeEventListener("playing", tryUnmute);
  }, [playablePath]);

  if (!selectedVideo) {
    return (
      <div className="vpm-root vpm-root--picker">
        <VideoLibraryPicker onSelect={setSelectedVideo} onExit={handleExit} />
        <style>{`.vpm-root--picker { position: fixed; inset: 0; z-index: 5000; background: var(--app-background); }`}</style>
      </div>
    );
  }

  if (prepareStatus === "preparing") {
    return (
      <div className="vpm-root vpm-root--prep michie-text-secondary">
        <div className="vpm-prep-box michie-box michie-box--primary">
          <p className="vpm-prep-title">Preparing video…</p>
          <p className="vpm-prep-sub">
            {prepareProgress === null || prepareProgress < 0
              ? "Checking video format"
              : `Converting to a compatible format — ${Math.round(prepareProgress)}%`}
          </p>
          {prepareProgress !== null && prepareProgress >= 0 && (
            <div className="vpm-prep-bar">
              <div
                className="vpm-prep-bar-fill"
                style={{ width: `${prepareProgress}%` }}
              />
            </div>
          )}
          <button className="vpm-prep-cancel" onClick={handleChangeVideo}>
            Cancel
          </button>
        </div>
        <style>{`
          .vpm-root--prep { position: fixed; inset: 0; z-index: 5000; background: #000; display: flex; align-items: center; justify-content: center; }
          .vpm-prep-box { padding: 32px 40px; border-radius: 20px; text-align: center; min-width: 280px; }
          .vpm-prep-title { margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 600; }
          .vpm-prep-sub { margin: 0 0 14px 0; font-size: 0.85rem; opacity: 0.75; }
          .vpm-prep-bar { width: 100%; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.15); overflow: hidden; }
          .vpm-prep-bar-fill { height: 100%; background: var(--color-primary, #fff); transition: width 0.2s ease; }
          .vpm-prep-cancel { margin-top: 16px; border: none; background: transparent; color: inherit; opacity: 0.7; cursor: pointer; font-size: 0.8rem; text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  if (prepareStatus === "error") {
    return (
      <div className="vpm-root vpm-root--prep michie-text-secondary">
        <div className="vpm-prep-box michie-box michie-box--primary">
          <p className="vpm-prep-title">This video can't be played</p>
          <p className="vpm-prep-sub">{prepareError}</p>
          <button className="vpm-prep-cancel" onClick={handleChangeVideo}>
            Choose another video
          </button>
        </div>
        <style>{`
          .vpm-root--prep { position: fixed; inset: 0; z-index: 5000; background: #000; display: flex; align-items: center; justify-content: center; }
          .vpm-prep-box { padding: 32px 40px; border-radius: 20px; text-align: center; min-width: 280px; max-width: 420px; }
          .vpm-prep-title { margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 600; }
          .vpm-prep-sub { margin: 0 0 14px 0; font-size: 0.85rem; opacity: 0.75; line-height: 1.5; }
          .vpm-prep-cancel { margin-top: 4px; border: none; background: transparent; color: inherit; opacity: 0.7; cursor: pointer; font-size: 0.8rem; text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="vpm-root">
      <video
        ref={videoRef}
        key={playablePath ?? selectedVideo.path}
        src={playablePath ? convertFileSrc(playablePath) : undefined}
        className="vpm-video"
        autoPlay
        muted
        onError={(e) => {
          console.error(
            "[VideoPlayerMode] video error:",
            e.currentTarget.error,
          );
          setPrepareError(
            "An error occurred while playing this video (the file may be corrupted or the format isn't supported).",
          );
          setPrepareStatus("error");
        }}
      >
        {selectedVideo.subtitle_path && (
          <track
            kind="subtitles"
            src={convertFileSrc(selectedVideo.subtitle_path)}
            default
          />
        )}
      </video>

      <button
        className="vpm-menu-btn michie-circle michie-circle--secondary michie-text-primary"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Video options"
      >
        <IconMenu />
      </button>

      {menuOpen && (
        <VideoMenu
          video={selectedVideo}
          onClose={() => setMenuOpen(false)}
          onChangeVideo={handleChangeVideo}
          onExit={handleExit}
          onSubtitleUpdated={(path) =>
            setSelectedVideo((v) => (v ? { ...v, subtitle_path: path } : v))
          }
        />
      )}

      <VideoControls videoRef={videoRef} title={selectedVideo.name} />

      <style>{`
        .vpm-root {
          position: fixed;
          inset: 0;
          z-index: 5000;
          background: #000;
          display: flex;
          flex-direction: column;
        }
        .vpm-video {
          flex: 1;
          width: 100%;
          min-height: 0;
          object-fit: contain;
          background: #000;
        }
        .vpm-menu-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5010;
        }
      `}</style>
    </div>
  );
}