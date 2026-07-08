import React, { useState } from "react";
import { toAssetUrl } from "../../../utils/assetURL";

interface ArtistAvatarProps {
  className?: string;
  path?: string | null;
  name: string;
  size?: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Warna konsisten per nama artist, biar avatar-nya nggak keliatan acak tiap render
const hashToHue = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

export const ArtistAvatar: React.FC<ArtistAvatarProps> = ({
  className,
  path,
  name,
  size = 48,
}) => {
  const [failed, setFailed] = useState(false);
  const src = !failed ? toAssetUrl(path) : null;
  const hue = hashToHue(name || "artist");

  return (
    <div
      className={`michie-circle michie-circle--secondary ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: src ? undefined : `hsl(${hue}, 45%, 28%)`,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span
          className="michie-text-primary"
          style={{
            fontWeight: 600,
            fontSize: size * 0.36,
            letterSpacing: 0.5,
          }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};