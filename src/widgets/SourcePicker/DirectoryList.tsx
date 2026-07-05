import React from 'react';
import { DirectoryItem } from './DirectoryItem';
import type { DirectoryInfo } from '../../globalValues';

interface DirectoryListProps {
  directories: DirectoryInfo[];
  onRemove: (path: string) => void;
  disabled?: boolean;
}

export const DirectoryList: React.FC<DirectoryListProps> = ({ directories, onRemove, disabled }) => {
  if (directories.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          opacity: 0.5,
          fontSize: '0.9rem',
        }}
      >
        Belum ada folder yang ditambahkan.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {directories.map((directory) => (
        <DirectoryItem
          key={directory.dir_path}
          path={directory.dir_path}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </div>
  );
};