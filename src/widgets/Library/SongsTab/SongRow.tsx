import React from "react";
import { AlbumArt } from "../common/AlbumArt";
import type { SongsFull } from "../../../globalValues";

interface SongRowProps {
  song: SongsFull;
  onPlay: (song: SongsFull) => void;
}

const formatDuration = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(14, 19);

export const SongRow: React.FC<SongRowProps> = ({ song, onPlay }) => {
  return (
    <div
      className="michie-song-row"
      onDoubleClick={() => onPlay(song)}
      style={{
        display: "grid",
        gridTemplateColumns: "48px 2fr 1.3fr 1.3fr 70px",
        alignItems: "center",
        gap: 14,
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
      }}
    >
      <AlbumArt
        path={song.cover}
        alt={song.album}
        size={44}
        rounded={8}
      />

      <div style={{ overflow: "hidden" }}>
        <div
          className="michie-text-secondary"
          style={{
            fontSize: "0.92rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {song.name}
        </div>

        <div
          className="michie-text-secondary"
          style={{
            fontSize: "0.78rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {song.artist}
        </div>
      </div>

      <div
        className="michie-text-secondary"
        style={{
          fontSize: "0.85rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {song.album}
      </div>

      <div
        className="michie-text-secondary"
        style={{
          fontSize: "0.85rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {song.genre}
      </div>

      <div
        className="michie-text-secondary"
        style={{
          fontSize: "0.85rem",
          textAlign: "right",
        }}
      >
        {formatDuration(song.duration)}
      </div>
    </div>
  );
};