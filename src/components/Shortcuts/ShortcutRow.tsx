import React from "react";
import { useShortcutsStore } from "../../stores/shortcutStore";
import type { ShortcutDef } from "../../config/shortcutsRegistry";

interface ShortcutRowProps {
  def: ShortcutDef;
  isRecording: boolean;
  error: string |null;
  onStartRecording: (id: string) => void;
}

export const ShortcutRow: React.FC<ShortcutRowProps> = ({
  def,
  isRecording,
  error,
  onStartRecording,
}) => {
  const combo = useShortcutsStore((s) => s.keymap[def.id]);
  const resetShortcut = useShortcutsStore((s) => s.resetShortcut);
  const isCustomized = combo !== def.defaultCombo;

  return (
    <div
      className="michie-box michie-box--primary"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          className="michie-text-secondary"
          style={{ fontSize: "0.95rem", fontWeight: 500 }}
        >
          {def.label}
        </div>

        {isRecording && error && (
          <div
            style={{
              fontSize: "0.78rem",
              color: "#ff6b6b",
              marginTop: "4px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          className="michie-box michie-box--secondary michie-text-primary"
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontFamily: "monospace",
            minWidth: "80px",
            textAlign: "center",
          }}
        >
          {isRecording ? "Press any keys…" : combo}
        </span>

        {def.customizable ? (
          <>
            <button
              className="michie-box michie-box--secondary michie-text-primary"
              onClick={() => onStartRecording(def.id)}
              disabled={isRecording}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                cursor: isRecording ? "default" : "pointer",
              }}
            >
              Edit
            </button>

            {isCustomized && (
              <button
                className="michie-box michie-box--secondary michie-text-primary"
                onClick={() => resetShortcut(def.id)}
                title="Restore default shortcut"
                style={{
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  opacity: 0.7,
                }}
              >
                Reset
              </button>
            )}
          </>
        ) : (
          <span
            style={{ fontSize: "0.75rem", opacity: 0.5 }}
            title="This shortcut can't be changed"
          >
             Fixed
          </span>
        )}
      </div>
    </div>
  );
};