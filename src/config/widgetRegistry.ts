import React from "react";
import { ClockWidget } from "../widgets/Clockwidget";
import { StatsWidget } from "../widgets/Statswidget";
import { LyricsWidget } from "../widgets/Lyrics";
import  VinylWidget  from "../widgets/VinylWidget"

export interface WidgetConfig {
  id: string;
  label: string;
  component: React.FC;
}

// Widget baru: tambah file di `widgets/`, lalu daftarkan di sini.
// Ini array kosong = tray kosong (state ini sudah ditangani WidgetTray),
// jadi aman kalau nanti ClockWidget/StatsWidget (contoh) mau dihapus.
export const widgetRegistry: WidgetConfig[] = [
  { id: "clock", label: "clock", component: ClockWidget },
  { id: "stats", label: "queue statistic", component: StatsWidget },
  { id: "lyrics", label: "song lyrics", component: LyricsWidget },
  { id: "vinyl", label: "vinyl player", component: VinylWidget },
  
];