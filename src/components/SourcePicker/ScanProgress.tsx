import React from 'react';

interface ScanProgressProps {
  isScanning: boolean;
  current: number;
  length: number;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ isScanning, current, length }) => {
  if (!isScanning) return null;

  const percent = length > 0 ? Math.min(100, (current / length) * 100) : 0;

  return (
    <div style={{ marginTop: 4, marginBottom: 4 }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 6 }}>
        Scanning library... ({current}/{length})
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'rgba(255,255,255,0.6)',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
    </div>
  );
};