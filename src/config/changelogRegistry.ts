// src/config/changelogRegistry.ts
//
// Daftar tetap riwayat versi, sama polanya kayak paletteRegistry.ts /
// themeRegistry.ts — kamu isi/edit manual tiap kali rilis versi baru.
// TIDAK diambil otomatis dari GitHub release notes (itu beda hal, dibaca
// terpisah lewat `update.body` pas ada update tersedia). Ini murni buat
// ditampilin sebagai riwayat lengkap semua versi di panel Version.
//
// Urutan: entry PALING BARU taruh PALING ATAS (index 0).

export interface ChangelogEntry {
  version: string; // harus persis sama kayak versi di tauri.conf.json/package.json/Cargo.toml
  date: string; // format bebas, misal "20 Juli 2026" — ini cuma ditampilkan, gak diparse
  notes: string[]; // satu baris = satu poin perubahan
}

export const changelogRegistry = [
  {
    version: "1.0.0-beta8",
    date: "August 2026",
    notes: [
      "Focused entirely on stability and performance before the first stable release.",
      "Further reduced CPU usage across the application, especially during continuous playback.",
      "Improved memory management and optimized background tasks.",
      "Fixed numerous UI glitches, animation issues, and edge-case bugs.",
      "Enhanced update reliability and overall application responsiveness.",
    ],
  },
  {
    version: "1.0.0-beta7",
    date: "August 2026",
    notes: [
      "Optimized widget rendering for smoother interactions.",
      "Reduced unnecessary component re-renders throughout the interface.",
      "Improved playback performance on lower-end devices.",
      "Fixed layout inconsistencies across different window sizes.",
      "Resolved several stability issues reported during beta testing.",
    ],
  },
  {
    version: "1.0.0-beta6",
    date: "July 2026",
    notes: [
      "Refactored large parts of the application architecture for better maintainability.",
      "Improved startup speed and reduced initialization overhead.",
      "Optimized internal state management and application rendering.",
      "Fixed multiple crashes and unexpected edge cases.",
      "Prepared the foundation for the final stable release.",
    ],
  },
  {
    version: "1.0.0-beta5",
    date: "July 2026",
    notes: [
      "Redesigned several settings panels for a cleaner user experience.",
      "Improved music library scanning and loading behavior.",
      "Added various interface refinements and visual improvements.",
      "Fixed playlist management issues and navigation bugs.",
    ],
  },
  {
    version: "1.0.0-beta4",
    date: "July 2026",
    notes: [
      "Introduced additional customization options for the interface.",
      "Improved overall application responsiveness.",
      "Enhanced compatibility with different desktop environments.",
      "Fixed multiple playback and UI-related bugs.",
    ],
  },
  {
    version: "1.0.0-beta3",
    date: "June 2026",
    notes: [
      "Added new widgets and expanded layout customization.",
      "Improved visual consistency across the application.",
      "Optimized rendering performance for animated components.",
      "Fixed several issues affecting user interactions.",
    ],
  },
  {
    version: "1.0.0-beta2",
    date: "June 2026",
    notes: [
      "Introduced major improvements to the music playback experience.",
      "Improved queue handling and playback reliability.",
      "Refined the application interface with cleaner layouts.",
      "Fixed numerous bugs discovered after the initial beta release.",
    ],
  },
  {
    version: "1.0.0-beta1",
    date: "June 2026",
    notes: [
      "First public beta release of Michie.",
      "Introduced the new desktop music player experience built with Tauri and React.",
      "Included music library management, playlists, queue, and modern playback controls.",
      "Laid the foundation for future customization, widgets, and personalization.",
    ],
  },
];
