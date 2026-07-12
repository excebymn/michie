import React from "react";
import { ClockWidget } from "../widgets/Clockwidget";
import { StatsWidget } from "../widgets/Statswidget";
import { LyricsWidget } from "../widgets/Lyrics";
import VinylWidget from "../widgets/VinylWidget";
import Visualizer from "../widgets/VisualizerWidget";
import SymetricVisualizer from "../widgets/SymetricVisualizer";
import MirrorVisualizer from "../widgets/MirrorVisualizer";
import RadialVisualizer from "../widgets/RadialVisualizer";
import PulsingBlob from "../widgets/PulsingBlob";
import SmoothWave from "../widgets/SmoothWave";
import DotGridVisualizer from "../widgets/DotGridVisualizer";
import PulseAlbum from "../widgets/PulseAlbum";
import { QueueView } from "../widgets/Queue";
import { QueueCard } from "../widgets/QueueCard";
import { DVDBouncingWidget } from "../widgets/DVDBouncingWidget";
import { VinylCatcherWidget } from "../widgets/CatcherGame";
import VintageTV from "../widgets/VintageTV";
import { LyricsFlipWidget } from "../widgets/LyricsFlipWidget";
import { LyricsKaraokeWidget } from "../widgets/LyricsKaraokeWidget";
import  Equalizer  from "../widgets/EqualizerWidget"; 
import EqualizerKnob from "../widgets/EqualizerKnob";
import EqualizerHorizontal from "../widgets/EqualizerHorizontal";
import EqualizerLed from "../widgets/EqualizerLED";
import EqualizerCurve from "../widgets/EqualizerCurve";
import CoverArtPuzzleWidget from "../widgets/PuzzleGame";
import PongWidget from "../widgets/PongWidget";
import FlappyBirdWidget from "../widgets/FlappyBirdWidget";
import SpectralAnalysisWidget from "../widgets/SpectralAnalysis";
import PhotoWidget from "../widgets/PhotoWidget";
import GifWidget from "../widgets/GifWidget";
import VideoWidget from "../widgets/VideoWidget";
import { ClockWidgetAnalog } from "../widgets/AnalogClock";
import { ClockWidgetMinimal } from "../widgets/MinimalClock";
import { ClockWidgetSplit } from "../widgets/SplitClock";
import { ClockWidgetGreeting } from "../widgets/GreetingClock";
import SpectrumCurveWidget from "../widgets/SpectrumCurveWidget";
import SpectrogramWidget from "../widgets/SpectogramWidget";
import WaveformWidget from "../widgets/WaveFormWidget";
import StereoCorrelationWidget from "../widgets/StereoCorrelationWidget";

// Kategori widget buat pengelompokan tampilan di Widget Tray.
export type WidgetCategory =
  | "Clocks"
  | "Player & Queue"
  | "Visualizers"
  | "Equalizers"
  | "Lyrics"
  | "Games"
  | "Custom Media"
  | "Misc"
  | "Analyzer"

// Urutan section di Widget Tray. Kategori yang gak ada di daftar ini
// (misal lupa ditambahin pas nambah kategori baru) otomatis jatuh ke
// paling akhir lewat fallback di WidgetTray, jadi gak pernah "hilang".
export const WIDGET_CATEGORY_ORDER: WidgetCategory[] = [
  "Clocks",
  "Player & Queue",
  "Visualizers",
  "Equalizers",
  "Lyrics",
  "Games",
  "Custom Media",
  "Misc",
];

export interface WidgetConfig {
  id: string;
  label: string;
  component: React.FC;
  category: WidgetCategory;
}

// Widget registry yang sudah dirapikan indentasinya dan diperbaiki komponen equalizernya
export const widgetRegistry: WidgetConfig[] = [
  // Clocks
  { id: "clock", label: "clock", component: ClockWidget, category: "Clocks" },
  { id: "analog-clock", label: "analog clock", component: ClockWidgetAnalog, category: "Clocks" },
  { id: "minimal-clock", label: "Minimal Clock", component: ClockWidgetMinimal, category: "Clocks" },
  { id: "split-clock", label: "Split Clock", component: ClockWidgetSplit, category: "Clocks" },
  { id: "greeting-clock", label: "Greeting Clock", component: ClockWidgetGreeting, category: "Clocks" },

  // Player & Queue
  { id: "Queue", label: "queue", component: QueueView, category: "Player & Queue" },
  { id: "queue-card", label: "queue card", component: QueueCard, category: "Player & Queue" },
  { id: "stats", label: "queue statistic", component: StatsWidget, category: "Player & Queue" },


  // Analyzers
  { id: "spectral-analysis", label: "spectral analysis", component: SpectralAnalysisWidget, category: "Analyzer" },
   { id: "spectrum-curve", label: "spectrum curve", component: SpectrumCurveWidget, category: "Analyzer" },
   { id: "spectrogram", label: "spectrogram", component: SpectrogramWidget, category: "Analyzer" },
   { id: "waveform", label: "waveform & loudness", component: WaveformWidget, category: "Analyzer" },
   { id: "stereo-correlation", label: "stereo correlation", component: StereoCorrelationWidget, category: "Analyzer" },


  // Visualizers
  { id: "visualizer", label: "visualizer", component: Visualizer, category: "Visualizers" },
  { id: "symetricVisualizer", label: "symetric visualizer", component: SymetricVisualizer, category: "Visualizers" },
  { id: "mirrorVisualizer", label: "mirror visualizer", component: MirrorVisualizer, category: "Visualizers" },
  { id: "radialVisualizer", label: "radial visualizer", component: RadialVisualizer, category: "Visualizers" },
  { id: "pulsingBlob", label: "pulsing blob", component: PulsingBlob, category: "Visualizers" },
  { id: "smoothWave", label: "smooth wave", component: SmoothWave, category: "Visualizers" },
  { id: "dotGridVisualizer", label: "dot grid visualizer", component: DotGridVisualizer, category: "Visualizers" },
  { id: "pulseAlbum", label: "pulsing album art", component: PulseAlbum, category: "Visualizers" },


  // Equalizers
  { id: "equalizer", label: "equalizer", component: Equalizer, category: "Equalizers" },
  { id: "equalizer-knob", label: "equalizer knob", component: EqualizerKnob, category: "Equalizers" },
  { id: "equalizer-horizontal", label: "equalizer horizontal", component: EqualizerHorizontal, category: "Equalizers" },
  { id: "equalizer-led", label: "equalizer led", component: EqualizerLed, category: "Equalizers" },
  { id: "equalizer-curve", label: "equalizer curve", component: EqualizerCurve, category: "Equalizers" },

  // Lyrics
  { id: "lyrics", label: "song lyrics", component: LyricsWidget, category: "Lyrics" },
  { id: "flip-lyrics", label: "flip lyrics", component: LyricsFlipWidget, category: "Lyrics" },
  { id: "karaoke-lyrics", label: "karaoke lyrics", component: LyricsKaraokeWidget, category: "Lyrics" },

  // Games
  { id: "dvd", label: "dvd", component: DVDBouncingWidget, category: "Games" },
  { id: "catcher-game", label: "vinyl catcher", component: VinylCatcherWidget, category: "Games" },
  { id: "puzzle cover", label: "puzzle cover", component: CoverArtPuzzleWidget, category: "Games" },
  { id: "pong", label: "pong", component: PongWidget, category: "Games" },
  { id: "flappy-bird", label: "flappy bird", component: FlappyBirdWidget, category: "Games" },

  // Custom Media
  { id: "custom-photo", label: "custom photo", component: PhotoWidget, category: "Custom Media" },
  { id: "custom-gif", label: "custom gif", component: GifWidget, category: "Custom Media" },
  { id: "custom-video", label: "custom video", component: VideoWidget, category: "Custom Media" },

  // Misc
  { id: "vintage-tv", label: "vintage tv", component: VintageTV, category: "Misc" },
  { id: "vinyl", label: "vinyl player", component: VinylWidget, category: "Misc" },
];