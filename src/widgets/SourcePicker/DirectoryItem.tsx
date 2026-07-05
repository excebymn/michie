import React from 'react';

interface DirectoryItemProps {
  path: string;
  onRemove: (path: string) => void;
  disabled?: boolean;
}

export const DirectoryItem: React.FC<DirectoryItemProps> = ({ path, onRemove, disabled }) => {
  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: 14,
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: '0.9rem',
          opacity: 0.85,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
        title={path}
      >
        {path}
      </span>

      <button
        onClick={() => onRemove(path)}
        disabled={disabled}
        className="glass-circle"
        style={{
          width: 32,
          height: 32,
          border: 'none',
          color: '#fff',
          fontSize: '1rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          opacity: disabled ? 0.4 : 1,
        }}
        aria-label={`Hapus folder ${path}`}
      >
        ✕
      </button>
    </div>
  );
};