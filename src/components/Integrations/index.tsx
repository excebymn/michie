import { useEffect, useState } from "react";
import { integrationsService } from "../../services/integrationsService";
import "./integrations.css";

export function IntegrationsPanel() {
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    integrationsService
      .getDiscordRpEnabled()
      .then(setDiscordEnabled)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDiscord = async () => {
    const next = !discordEnabled;
    // Optimistic update - toggle langsung kerasa responsif di UI. Connect/
    // disconnect ke Discord IPC jalan di background thread di sisi Rust
    // (lihat set_discord_rp_enabled di discord.rs), jadi tidak perlu nunggu
    // di sini.
    setDiscordEnabled(next);
    try {
      await integrationsService.setDiscordRpEnabled(next);
    } catch (e) {
      // Gagal persist ke DB - balikin toggle ke posisi semula biar UI tidak
      // menampilkan status yang salah.
      setDiscordEnabled(!next);
    }
  };

  const sectionTitleClass =
    "michie-text-primary text-[11px] font-semibold uppercase tracking-[0.12em]";

  return (
    <div className="integrations-panel flex flex-col gap-7 p-5">
      <section className="integrations-section flex flex-col gap-3">
        <h2 className="michie-text-secondary appearance-section-title">
          Connect Michie to other apps and services
        </h2>

        <div className="integrations-item michie-box michie-box--secondary flex items-center justify-between gap-4 rounded-md p-4">
          <div className="flex flex-col gap-1">
            <p className={sectionTitleClass}>Discord Rich Presence</p>
            <p className="michie-text-primary text-sm opacity-80">
              Show the song you're listening to on your Discord profile.
              Requires the Discord desktop app to be running.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={discordEnabled}
            disabled={loading}
            className={[
              "integrations-toggle michie-circle michie-circle--primary",
              discordEnabled ? "integrations-toggle--on" : "",
            ].join(" ")}
            onClick={handleToggleDiscord}
          >
            <span className="integrations-toggle-knob" />
          </button>
        </div>
      </section>

      {/* Slot buat integrasi berikutnya (mis. toggle MPRIS/SMTC kalau nanti
          mau dibikin bisa dimatiin juga) - tinggal tambah <div className="integrations-item">
          baru di sini, style-nya udah siap pakai. */}
    </div>
  );
}