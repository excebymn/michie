import { useEffect, useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { PlaylistCard } from "./PlaylistCard";
import { PlaylistDetail } from "./PlaylistDetail";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { IconPlus } from "./Icons";

export function PlaylistsView() {
  const playlistList = useAppStore((s) => s.playlistList);
  const refreshPlaylists = useAppStore((s) => s.refreshPlaylists);
  const [selected, setSelected] = useState<number | "liked" | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    refreshPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (selected !== null) {
    return <PlaylistDetail playlistId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="pv-root">
      <div className="pv-header">
        <h2 className="pv-title michie-text-secondary">Playlist</h2>
        <button className="pv-create michie-box michie-box--secondary michie-text-primary" onClick={() => setShowCreate(true)}>
          <IconPlus />
          <span>Create</span>
        </button>
      </div>

      <div className="pv-grid">
        <PlaylistCard playlist="liked" onClick={() => setSelected("liked")} />
        {playlistList.map((p) => (
          <PlaylistCard key={p.id} playlist={p} onClick={() => setSelected(p.id)} />
        ))}
      </div>

      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onCreated={(name) => {
            const created = useAppStore.getState().playlistList.find((p) => p.name === name);
            if (created) setSelected(created.id);
          }}
        />
      )}

      <style>{`
        .pv-root { display: flex; flex-direction: column; gap: 20px; height: 100%; overflow-y: auto; }
        .pv-header { display: flex; align-items: center; justify-content: space-between; }
        .pv-title { margin: 0; font-size: 1.5rem; font-weight: 700; }
        .pv-create { border: none; display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .pv-create svg { width: 14px; height: 14px; }
        .pv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
      `}</style>
    </div>
  );
}