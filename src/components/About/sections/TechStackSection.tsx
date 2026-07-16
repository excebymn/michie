import { useEffect, useState } from "react";

// Fallback dipakai kalau dijalankan di luar Tauri runtime (misal preview
// browser biasa) sehingga getVersion() dari @tauri-apps/api tidak bisa jalan.
// Nilai ini harus disamakan manual dengan "version" di tauri.conf.json kalau
// versi app di-bump di masa depan.
const FALLBACK_VERSION = "1.0.0-beta";

const TECH_STACK: string[] = [
  "Tauri v2 (Rust + WebView) — desktop app shell",
  "Rust — audio engine (rodio), SQLite access (sqlx), real-time FFT (rustfft)",
  "React 19 + TypeScript — frontend interface",
  "Zustand — frontend state management",
  "SQLite — local library, playlist, and settings storage",
];

export default function TechStackSection() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then((v) => {
        if (!cancelled) setVersion(v);
      })
      .catch(() => {
        if (!cancelled) setVersion(FALLBACK_VERSION);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="about-section flex flex-col gap-3">
      <div className="about-version-row">
        <p className="about-section-title michie-text-secondary">Version</p>
        <span className="about-version-badge michie-box michie-box--secondary michie-text-primary">
          {version ?? "…"}
        </span>
      </div>

      <p className="about-section-title michie-text-secondary">Built with</p>
      <ul className="about-tech-list">
        {TECH_STACK.map((item) => (
          <li key={item} className="about-tech-item michie-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}