import React, { useState } from "react";
import { toAssetUrl } from "../../../utils/assetURL";

interface AlbumArtProps {
  className?: string;
  path?: string | null;
  alt: string;
  size?: number;
  rounded?: number;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  className,
  path,
  alt,
  size = 48,
  rounded = 8,
}) => {
  const [failed, setFailed] = useState(false);
  const src = !failed ? toAssetUrl(path) : null;

  return (
    <div
      className={`michie-box michie-box--secondary ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <svg
          className="michie-text-secondary"
          viewBox="0 0 24 24"
          width={size * 0.45}
          height={size * 0.45}
          fill="currentColor"
        >
          <path d="M12 3v10.55a4 4 0 1 0 2 3.45V7h4V3h-6z" />
        </svg>
      )}
    </div>
  );
};
