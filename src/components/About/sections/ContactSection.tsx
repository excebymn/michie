import { openUrl } from "@tauri-apps/plugin-opener";

const REPO_URL = "https://github.com/excebymn/michie";

async function handleContactClick(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  try {
    // Buka lewat browser sistem, bukan di dalam webview app.
    await openUrl(REPO_URL);
  } catch {
    // Fallback kalau dijalankan di luar Tauri (preview browser biasa).
    window.open(REPO_URL, "_blank", "noreferrer");
  }
}

export default function ContactSection() {
  return (
    <section className="about-section flex flex-col gap-3">
      <div className="about-contact-box michie-box michie-box--primary">
        <p className="michie-text-secondary about-contact-title">
          Got a suggestion or found a bug?
        </p>
        <p className="michie-text-secondary about-contact-text">
          Michie is built and maintained by a single developer. Any feature
          request, development suggestion, or feedback is genuinely welcome
          and helps shape where this app goes next — reach out anytime.
        </p>
        <a
          href={REPO_URL}
          onClick={handleContactClick}
          className="about-contact-link michie-box michie-box--secondary michie-text-primary"
        >
          Contact developer on GitHub
        </a>
      </div>
    </section>
  );
}