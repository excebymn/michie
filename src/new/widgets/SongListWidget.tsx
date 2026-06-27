import { useAppStore } from "../stores/appStore";
import { playerService } from "../services/playerService";
import type { SongsFull } from "../globalValues";

export default function SongListWidget() {
  const songList = useAppStore((state) => state.songList);

  if (songList.length === 0) {
    return <div className="widget-card">No songs loaded</div>;
  }

  return (
    <div className="widget-card song-list-widget">
      <div className="widget-header">Library Preview</div>
      <div className="widget-body">
        {songList.slice(0, 8).map((song: SongsFull, index: number) => (
          <div className="song-row" key={`${song.path}-${index}`} onClick={() => playerService.playSong(song)}>
            <span className="song-name">{song.name}</span>
            <span className="song-meta">{song.album_artist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
