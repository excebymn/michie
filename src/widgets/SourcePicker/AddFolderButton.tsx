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
      className="michie-box--secondary michie-text-primary"
      style={{
        padding: '14px 18px',
        borderRadius: 14,
        border: 'none',
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
      Add Folder
    </button>
  );
};