import { usePlayerStore } from "../stores/playerStore";

export default function NowPlayingWidget() {
  const { currentSong, isPlaying, songProgress, play, pause, seek } = usePlayerStore();

  if (!currentSong) {
    return <div className="widget-card">No track selected</div>;
  }

  return (
    <div className="widget-card now-playing-widget">
      <div className="widget-header">Now Playing</div>
      <div className="widget-body">
        <div className="song-meta">
          <div className="song-title">{currentSong.name}</div>
          <div className="song-subtitle">{currentSong.artist} · {currentSong.album}</div>
        </div>
        <div className="progress-row">
          <input
            type="range"
            min={0}
            max={currentSong.duration}
            value={songProgress}
            onChange={(event) => seek(Number(event.currentTarget.value))}
          />
          <div className="duration-label">{new Date(songProgress * 1000).toISOString().slice(14, 19)}</div>
        </div>
        <div className="controls-row">
          <button onClick={() => (isPlaying ? pause() : play())}>
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
