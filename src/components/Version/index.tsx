// src/components/Version/index.tsx
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForUpdate,
  installUpdate,
  type UpdateProgress,
} from "../../services/updateService";
import { changelogRegistry } from "../../config/changelogRegistry";
import "./index.css";
type CheckStatus = "idle" | "checking" | "up-to-date" | "available" | "error";

export function VersionPanel() {
  const [currentVersion, setCurrentVersion] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    getVersion().then(setCurrentVersion);
  }, []);

  const handleCheck = async () => {
    setStatus("checking");
    setErrorMsg("");
    try {
      const update = await checkForUpdate();
      if (update) {
        setPendingUpdate(update);
        setStatus("available");
      } else {
        setPendingUpdate(null);
        setStatus("up-to-date");
      }
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  };

  const handleConfirmInstall = async () => {
    if (!pendingUpdate) return;
    setShowConfirm(false);
    setInstalling(true);
    try {
      await installUpdate(pendingUpdate, setProgress);
      // Kalau berhasil, installUpdate() relaunch app sendiri di baris
      // terakhirnya — UI ini gak akan sempat render state "selesai".
    } catch (err) {
      setInstalling(false);
      setErrorMsg(String(err));
      setStatus("error");
    }
  };

  const sectionTitleClass =
    "michie-text-primary text-[11px] font-semibold uppercase tracking-[0.12em]";

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100))
      : 0;

  return (
    <div className="version-panel flex flex-col gap-6 p-5">
      <section className="flex flex-col gap-2">
        <h2 className="michie-text-secondary appearance-section-title">
          Version
        </h2>
        <p className="michie-text-secondary text-sm">
          Keep Michie up to date with the latest fixes and features.
        </p>
      </section>

      <section className="michie-box michie-box--secondary flex flex-col gap-3 rounded-md p-4 w-full">
        <p className={sectionTitleClass}>current version</p>
        <p className="michie-text-primary text-lg font-semibold">
          v{currentVersion || "…"}
        </p>
      </section>

      {status === "available" && pendingUpdate && (
        <section className="michie-box michie-box--secondary flex flex-col gap-3 rounded-md p-4 w-full">
          <p className={sectionTitleClass}>update available</p>
          <p className="michie-text-primary text-lg font-semibold">
            v{pendingUpdate.version}
          </p>
          {pendingUpdate.body && (
            <p className="michie-text-secondary text-sm whitespace-pre-line">
              {pendingUpdate.body}
            </p>
          )}
          <button
            type="button"
            className="michie-box michie-box--primary michie-text-secondary rounded-md px-4 py-2 text-sm self-start"
            onClick={() => setShowConfirm(true)}
            disabled={installing}
          >
            Update now
          </button>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="version-panel-label">changelog</p>
        <div className="flex flex-col gap-3">
          {changelogRegistry.map((entry) => {
            const isCurrent = entry.version === currentVersion;
            return (
              <div
                key={entry.version}
                className="version-panel-card michie-box michie-box--secondary flex flex-col gap-1.5 rounded-md p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="michie-text-primary text-sm font-semibold">
                    v{entry.version}
                    {isCurrent && (
                      <span className="michie-text-primary text-xs font-normal">
                        {" "}
                        · current
                      </span>
                    )}
                  </p>
                  {entry.date && (
                    <p className="michie-text-primary text-xs">{entry.date}</p>
                  )}
                </div>
                {entry.notes.length > 0 && (
                  <ul className="michie-text-primary flex flex-col gap-1 pl-4 text-sm">
                    {entry.notes.map((note, i) => (
                      <li key={i} className="list-disc">
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {status === "up-to-date" && (
        <p className="michie-text-secondary text-sm">
          You're already on the latest version.
        </p>
      )}

      {status === "error" && (
        <p className="michie-text-secondary text-sm">
          Couldn't check for updates: {errorMsg}
        </p>
      )}

      {installing && progress && (
        <section className="flex flex-col gap-2">
          <p className="michie-text-secondary text-sm">
            Downloading update… {progressPct}%
          </p>
          <div className="michie-box michie-box--secondary h-2 w-full overflow-hidden rounded-full">
            <div
              className="michie-box michie-box--primary h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                transition: "width 150ms ease-out",
              }}
            />
          </div>
        </section>
      )}

      <button
        type="button"
        className="michie-box michie-box--secondary michie-text-primary rounded-md px-4 py-2 text-sm self-start"
        onClick={handleCheck}
        disabled={status === "checking" || installing}
      >
        {status === "checking" ? "Checking…" : "Check for updates"}
      </button>

      {/* Konfirmasi custom — window.confirm() gak reliable di WebView ini
          (konvensi #5 project). Kalau components/Playlists/ConfirmDialog.tsx
          punya props yang cocok, pertimbangkan ganti blok di bawah ini
          pakai komponen itu, biar gak ada 2 gaya modal konfirmasi beda. */}
      {showConfirm && pendingUpdate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            className="michie-box michie-box--primary flex flex-col gap-4 rounded-md p-6"
            style={{ maxWidth: "360px" }}
          >
            <p className="michie-text-primary text-base font-semibold">
              Install v{pendingUpdate.version}?
            </p>
            <p className="michie-text-secondary text-sm">
              Michie will restart to finish installing the update.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="michie-box michie-box--secondary michie-text-primary rounded-md px-4 py-2 text-sm"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="michie-box michie-box--secondary michie-text-primary rounded-md px-4 py-2 text-sm"
                onClick={handleConfirmInstall}
              >
                Restart &amp; install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}