import { useEffect, useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { videoService } from "../../services/videoService";
import type { VideoInfo, DirectoryInfo } from "../../globalValues";

interface VideoLibraryPickerProps {
  onSelect: (video: VideoInfo) => void;
  onExit: () => void;
}

export function VideoLibraryPicker({
  onSelect,
  onExit,
}: VideoLibraryPickerProps) {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCurrent, setScanCurrent] = useState(0);
  const [scanLength, setScanLength] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [v, d] = await Promise.all([
      videoService.getAllVideos(),
      videoService.getDirectories(),
    ]);
    setVideos(v);
    setDirectories(d);
  }, []);

  useEffect(() => {
    refresh();
    const cleanups: Array<() => void> = [];
    (async () => {
      cleanups.push(
        await videoService.onScanStarted(() => setIsScanning(true)),
      );
      cleanups.push(
        await videoService.onScanProgress((e) => {
          setScanCurrent(e.payload.current);
          setScanLength(e.payload.length);
        }),
      );
      cleanups.push(
        await videoService.onScanFinished(async () => {
          setIsScanning(false);
          await refresh();
        }),
      );
    })();
    return () => cleanups.forEach((fn) => fn());
  }, [refresh]);

  const handleAddFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;
    setIsBusy(true);
    try {
      await videoService.addDirectory(selected);
      await videoService.scanDirectory();
    } finally {
      setIsBusy(false);
    }
  };

  const handleRescan = async () => {
    setIsBusy(true);
    try {
      await videoService.scanDirectory();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="vlp-root michie-text-secondary">
      <div className="vlp-header">
        <div>
          <h2 className="vlp-title">Video Player Mode</h2>
          <p className="vlp-desc">
            Pick a video to play, or add a video folder first if you
            haven&apos;t yet.
          </p>
        </div>
        <button
          className="vlp-exit michie-box michie-box--primary"
          onClick={onExit}
        >
          Exit
        </button>
      </div>

      <div className="vlp-actions">
        <button
          className="michie-box--secondary michie-text-primary vlp-add"
          onClick={handleAddFolder}
          disabled={isBusy || isScanning}
        >
          + Add video folder
        </button>
        {directories.length > 0 && (
          <button
            className="michie-box--primary michie-text-secondary vlp-rescan"
            onClick={handleRescan}
            disabled={isBusy || isScanning}
          >
            {isScanning
              ? `Scanning... (${scanCurrent}/${scanLength})`
              : "Rescan"}
          </button>
        )}
      </div>

      <div className="vlp-grid">
        {videos.length === 0 ? (
          <div className="vlp-empty">
            {directories.length === 0
              ? "No video folders added yet."
              : "No videos found in the registered folders yet."}
          </div>
        ) : (
          videos.map((v) => (
            <button
              key={v.path}
              className="vlp-card michie-box michie-box--primary michie-text-secondary"
              onClick={() => onSelect(v)}
            >
              <div className="vlp-card-icon">🎬</div>
              <div className="vlp-card-name">{v.name}</div>
            </button>
          ))
        )}
      </div>

      <style>{`
        .vlp-root { width: 100%; height: 100%; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; overflow: hidden; }
        .vlp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .vlp-title { margin: 0 0 6px 0; font-size: 2rem; font-weight: 600; }
        .vlp-desc { margin: 0; opacity: 0.8; font-size: 0.95rem; max-width: 480px; line-height: 1.5; }
        .vlp-exit { border: none; padding: 12px 18px; border-radius: 14px; font-size: 0.9rem; cursor: pointer; flex-shrink: 0; }
        .vlp-actions { display: flex; gap: 10px; }
        .vlp-add, .vlp-rescan { border: none; padding: 12px 18px; border-radius: 14px; font-size: 0.9rem; cursor: pointer; }
        .vlp-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
        .vlp-empty { grid-column: 1 / -1; opacity: 0.5; text-align: center; padding: 60px 20px; }
        .vlp-card { border: none; padding: 16px; border-radius: 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .vlp-card-icon { font-size: 2.2rem; }
        .vlp-card-name { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
      `}</style>
    </div>
  );
}