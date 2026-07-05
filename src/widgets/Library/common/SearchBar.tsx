import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="michie-box" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--michie-on-surface)" strokeWidth="2" style={{ opacity: 0.6 }}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Cari...'}
        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--michie-on-surface)', fontSize: '0.9rem', flex: 1 }}
      />
    </div>
  );
};