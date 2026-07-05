import React from 'react';

interface AddFolderButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const AddFolderButton: React.FC<AddFolderButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="michie-box"
      style={{
        padding: '14px 18px',
        border: 'none',
        color: 'var(--michie-on-surface)',
        fontWeight: 500,
        fontSize: '0.95rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>+</span>
      Tambah Folder
    </button>
  );
};