import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="michie-box--secondary michie-text-primary"
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};