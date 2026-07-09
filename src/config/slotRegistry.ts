export interface SlotConfig {
  id: string;
  label: string;
}

// Tambah slot baru di sini kalau nanti Grid layout nambah kolom/posisi —
// LeftColumn/RightColumn dan preview di WidgetTray otomatis ikut, nggak perlu
// diubah manual di banyak tempat.
export const slotRegistry: SlotConfig[] = [
  { id: "left-1", label: "left top" },
  { id: "left-2", label: "left bottom" },
  { id: "right-1", label: "right top" },
  { id: "right-2", label: "right bottom" },
];