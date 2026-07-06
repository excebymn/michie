import React from "react";
import { AlbumArt } from "../common/AlbumArt";
import type { AlbumDetails } from "../../../globalValues";

interface AlbumCardProps {
  album: AlbumDetails;
  onClick: (album: AlbumDetails) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  return (
    <div
      onClick={() => onClick(album)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        width: 160,
      }}
    >
      <AlbumArt
        path={album.cover}
        alt={album.album}
        size={160}
        rounded={12}
      />

      <div>
        <div
          className="michie-text-secondary"
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {album.album}
        </div>

        <div
          className="michie-text-secondary"
          style={{
            fontSize: "0.78rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {album.album_artist}
        </div>
      </div>
    </div>
  );
}