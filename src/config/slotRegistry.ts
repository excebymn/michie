export interface SlotConfig {
  id: string;
  label: string;
}

// Tambah slot baru di sini kalau nanti Grid layout nambah kolom/posisi —
// LeftColumn/RightColumn dan preview di WidgetTray otomatis ikut, nggak perlu
// diubah manual di banyak tempat.
export const slotRegistry: SlotConfig[] = [
  { id: "left-1", label: "Kiri Atas" },
  { id: "left-2", label: "Kiri Bawah" },
  { id: "right-1", label: "Kanan Atas" },
  { id: "right-2", label: "Kanan Bawah" },
];