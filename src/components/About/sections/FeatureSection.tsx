const FEATURES: string[] = [
  "Local, offline music library — scan and browse by song, album, artist, or genre",
  "Gapless playback with a smart queue, shuffle, and repeat modes",
  "Playlists and Liked Songs",
  "Synced lyrics, matched automatically via LRCLIB",
  "Real-time audio visualizers in multiple styles",
  "Deep theming — structural themes, color palettes, or auto-match your album art",
  "Custom app backgrounds (color, image, or linked to your palette)",
  "Work Mode — a distraction-free, resource-light mode for working or gaming",
  "Fully customizable keyboard shortcuts",
  "Discord Rich Presence integration",
];

export default function FeaturesSection() {
  return (
    <section className="about-section flex flex-col gap-3">
      <p className="about-section-title michie-text-secondary">Features</p>
      <ul className="about-feature-list">
        {FEATURES.map((feature) => (
          <li key={feature} className="about-feature-item michie-text-secondary">
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}