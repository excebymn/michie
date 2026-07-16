import React, { useEffect, useState } from "react";
import { shortcutsRegistry } from "../../config/shortcutsRegistry";
import { useShortcutsStore } from "../../stores/shortcutStore";
import { eventToCombo } from "../../utils/KeyCombo";
import { ShortcutRow } from "./ShortcutRow";

export const ShortcutsPanel: React.FC = () => {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setShortcut = useShortcutsStore((s) => s.setShortcut);
  const resetAll = useShortcutsStore((s) => s.resetAll);
  const setCapturing = useShortcutsStore((s) => s.setCapturing);

  // Separate listener from the global shortcut handler in MainPlayer.
  // capture: true ensures keystrokes are intercepted and prevented before
  // they trigger their actual action (e.g. Space toggling playback while
  // recording a shortcut). The store's isCapturing flag keeps MainPlayer
  // inactive while shortcut recording is in progress.
  useEffect(() => {
    if (!recordingId) return;

    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === "Escape") {
        setRecordingId(null);
        setCapturing(false);
        return;
      }

      const combo = eventToCombo(e);
      if (!combo) return; // Wait until a non-modifier key is pressed.

      const result = setShortcut(recordingId, combo);
      if (result.ok) {
        setError(null);
        setRecordingId(null);
        setCapturing(false);
      } else {
        setError(
          result.conflictWith
            ? `This shortcut is already assigned to "${result.conflictWith}".`
            : "This shortcut can't be used.",
        );
      }
    };

    window.addEventListener("keydown", handleCapture, true);
    return () => window.removeEventListener("keydown", handleCapture, true);
  }, [recordingId, setShortcut, setCapturing]);

  const startRecording = (id: string) => {
    setError(null);
    setRecordingId(id);
    setCapturing(true);
  };

  const groups = Array.from(new Set(shortcutsRegistry.map((d) => d.group)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2 className="michie-text-secondary" style={{ margin: 0, fontSize: "2rem", fontWeight: 600 }}>
          Shortcuts
        </h2>

        <button
          className="michie-box michie-box--secondary michie-text-primary"
          onClick={() => {
            resetAll();
            setRecordingId(null);
            setCapturing(false);
            setError(null);
          }}
          style={{
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Restore defaults
        </button>
      </div>

      <p
        className="michie-text-secondary"
        style={{
          margin: 0,
          opacity: 0.7,
          fontSize: "0.9rem",
          lineHeight: 1.5,
          maxWidth: "520px",
        }}
      >
        Click <strong>Edit</strong>, then press the key combination you want.
        Press <strong>Escape</strong> to cancel without saving. Shortcuts remain
        active throughout the app, except while you're typing in a text field
        (such as search or rename).
      </p>

      {groups.map((group) => (
        <div
          key={group}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <h3
            className="michie-text-secondary"
            style={{
              margin: 0,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.6,
            }}
          >
            {group}
          </h3>

          {shortcutsRegistry
            .filter((d) => d.group === group)
            .map((def) => (
              <ShortcutRow
                key={def.id}
                def={def}
                isRecording={recordingId === def.id}
                error={error}
                onStartRecording={startRecording}
              />
            ))}
        </div>
      ))}
    </div>
  );
};