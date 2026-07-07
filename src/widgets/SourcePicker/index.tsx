import React from "react";
import { useSourcePicker } from "./useSourcePicker";
import { DirectoryList } from "./DirectoryList";
import { AddFolderButton } from "./AddFolderButton";
import { ScanProgress } from "./ScanProgress";

export const SourcePicker: React.FC = () => {
  const {
    directories,
    isScanning,
    scanCurrent,
    scanLength,
    isBusy,
    handleAddFolder,
    handleRemoveFolder,
    handleRescan,
  } = useSourcePicker();

  const hasDirectories = directories.length > 0;

  return (
    <div
      className="michie-text-secondary"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        height: "100%",
      }}
    >
      <div>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "2rem", fontWeight: 600 }}>
          Source Directory
        </h2>
        <p
          style={{
            margin: 0,
            opacity: 0.8,
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Add the folder containing your music. Michie will scan it and add the
          songs to the library.
        </p>
      </div>

      <ScanProgress
        isScanning={isScanning}
        current={scanCurrent}
        length={scanLength}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <AddFolderButton
            onClick={handleAddFolder}
            disabled={isBusy || isScanning}
          />
        </div>

        <button
          onClick={handleRescan}
          disabled={isBusy || isScanning || !hasDirectories}
          className="michie-box--secondary michie-text-primary"
          style={{
            padding: "14px 20px",
            borderRadius: 14,
            border: "none",
            fontWeight: 500,
            fontSize: "0.95rem",
            cursor:
              isBusy || isScanning || !hasDirectories
                ? "not-allowed"
                : "pointer",
            opacity: isBusy || isScanning || !hasDirectories ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {isScanning ? "Scanning..." : "Rescan"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <DirectoryList
          directories={directories}
          onRemove={handleRemoveFolder}
          disabled={isBusy || isScanning}
        />
      </div>
    </div>
  );
};
