import { open } from "@tauri-apps/plugin-dialog";
import { videoService } from "../../services/videoService";
import type { VideoInfo } from "../../globalValues";

interface VideoMenuProps {
  video: VideoInfo;
  onClose: () => void;
  onChangeVideo: () => void;
  onExit: () => void;
  onSubtitleUpdated: (path: string | null) => void;
}

export function VideoMenu({
  video,
  onClose,
  onChangeVideo,
  onExit,
  onSubtitleUpdated,
}: VideoMenuProps) {
  const handleAttachSubtitle = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Subtitle", extensions: ["srt", "vtt"] }],
    });
    if (!selected || Array.isArray(selected)) return;
    const newPath = await videoService.setSubtitle(video.path, selected);
    onSubtitleUpdated(newPath);
    onClose();
  };

  const handleClearSubtitle = async () => {
    await videoService.clearSubtitle(video.path);
    onSubtitleUpdated(null);
    onClose();
  };

  return (
    <>
      <div className="vm-backdrop" onClick={onClose} />
      <div className="vm-root michie-box michie-box--primary michie-text-secondary">
        <button className="vm-item" onClick={handleAttachSubtitle}>
          {video.subtitle_path ? "Change subtitle" : "Attach subtitle"}
        </button>
        {video.subtitle_path && (
          <button className="vm-item" onClick={handleClearSubtitle}>
            Remove subtitle
          </button>
        )}
        <button className="vm-item" onClick={onChangeVideo}>
          Change video
        </button>
        <button className="vm-item vm-item--danger" onClick={onExit}>
          Exit Video Mode
        </button>
      </div>

      <style>{`
        .vm-backdrop { position: fixed; inset: 0; z-index: 5015; }
        .vm-root {
          position: absolute;
          top: 68px;
          right: 20px;
          z-index: 5020;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
          border-radius: 16px;
          min-width: 210px;
        }
        .vm-item {
          border: none;
          background: transparent;
          text-align: left;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.9rem;
          cursor: pointer;
          color: inherit;
        }
        .vm-item:hover { background: rgba(255, 255, 255, 0.08); }
        .vm-item--danger { opacity: 0.85; }
      `}</style>
    </>
  );
}