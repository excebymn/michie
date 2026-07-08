import React from "react";

interface SearchBarProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div
      className={`michie-box michie-box--secondary michie-text-primary ${className ?? ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 12,
      }}
    >
      <svg
        className="michie-text-primary"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        className="michie-text-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Seacrh..."}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: "0.9rem",
          flex: 1,
        }}
      />
    </div>
  );
};
