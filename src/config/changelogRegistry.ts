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

export const changelogRegistry: ChangelogEntry[] = [
  // Contoh — ganti/tambah sesuai versi kamu sendiri:
  // {
  //   version: "1.0.0-beta6",
  //   date: "28 Juli 2026",
  //   notes: [
  //     "Tambah fitur auto-update lintas platform",
  //     "Tambah panel Version di Settings",
  //   ],
  // },
  {
    version: "1.0.0-beta5",
    date: "July 28, 2026",
    notes: ["fixing a lot of error, at this version, i hope this is a last version of beta before i release stable version"],
  },
    {
    version: "1.0.0-beta4",
    date: "July 14, 2026",
    notes: ["another trying to release, at this version, michie is very messed up, with resource overused, and error dependencies. it makes me not touch my laptop for 10 day straight"],
  },
    {
    version: "1.0.0-beta3",
    date: "July 28, 2026",
    notes: ["i try to fix the release.yml error. but its not clear yet"],
  },
    {
    version: "1.0.0-beta2",
    date: "July 28, 2026",
    notes: ["firstly adding release.yml to try releasing, it ended up fails to build in 3 os in github action"],
  },
    {
    version: "1.0.0-beta",
    date: "July 28, 2026",
    notes: ["michie's firstly tag with tauri + react ui and release it, it dont even have release.yml yet"],
  },
      {
    version: "0.1.0-alpha.1",
    date: "June 26, 2026",
    notes: ["michie at her firts version, not even the ui, this version is still based on flutter"],
  },
];