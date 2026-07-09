import React from "react";
import { ClockWidget } from "../widgets/Clockwidget";
import { StatsWidget } from "../widgets/Statswidget";
import { LyricsWidget } from "../widgets/Lyrics";
import  VinylWidget  from "../widgets/VinylWidget"
import  Visualizer  from "../widgets/VisualizerWidget"
import SymetricVisualizer from "../widgets/SymetricVisualizer"
import MirrorVisualizer from "../widgets/MirrorVisualizer";
import RadialVisualizer from "../widgets/RadialVisualizer";
import PulsingBlob from "../widgets/PulsingBlob";
import SmoothWave from "../widgets/SmoothWave";
import DotGridVisualizer from "../widgets/DotGridVisualizer";
import PulseAlbum from "../widgets/PulseAlbum";

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
  { id: "visualizer", label: "visualizer", component: Visualizer },
  { id: "symetricVisualizer", label: "symetric visualizer", component: SymetricVisualizer },
  { id: "mirrorVisualizer", label: "mirror visualizer", component: MirrorVisualizer },
{ id: "radialVisualizer", label: "radial visualizer", component: RadialVisualizer },
{ id: "pulsingBlob", label: "pulsing blob", component: PulsingBlob },
{ id: "smoothWave", label: "smooth wave", component: SmoothWave },
{ id: "dotGridVisualizer", label: "dot grid visualizer", component: DotGridVisualizer },
{ id: "pulseAlbum", label: "pulsing album art", component: PulseAlbum },
];