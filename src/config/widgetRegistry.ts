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
export interface WidgetConfig {
  id: string;
  label: string;
  component: React.FC;
}

// Widget registry yang sudah dirapikan indentasinya dan diperbaiki komponen equalizernya
export const widgetRegistry: WidgetConfig[] = [
  { id: "clock", label: "clock", component: ClockWidget },
  { id: "stats", label: "queue statistic", component: StatsWidget },
  { id: "lyrics", label: "song lyrics", component: LyricsWidget },
  { id: "flip-lyrics", label: "flip lyrics", component: LyricsFlipWidget },
  { id: "karaoke-lyrics", label: "karaoke lyrics", component: LyricsKaraokeWidget },
  { id: "vinyl", label: "vinyl player", component: VinylWidget },
  { id: "visualizer", label: "visualizer", component: Visualizer },
  { id: "equalizer", label: "equalizer", component: Equalizer }, 
  { id: "symetricVisualizer", label: "symetric visualizer", component: SymetricVisualizer },
  { id: "mirrorVisualizer", label: "mirror visualizer", component: MirrorVisualizer },
  { id: "radialVisualizer", label: "radial visualizer", component: RadialVisualizer },
  { id: "pulsingBlob", label: "pulsing blob", component: PulsingBlob },
  { id: "smoothWave", label: "smooth wave", component: SmoothWave },
  { id: "dotGridVisualizer", label: "dot grid visualizer", component: DotGridVisualizer },
  { id: "pulseAlbum", label: "pulsing album art", component: PulseAlbum },
  { id: "Queue", label: "queue", component: QueueView },
  { id: "queue-card", label: "queue card", component: QueueCard },
  { id: "dvd", label: "dvd", component: DVDBouncingWidget },
  { id: "catcher-game", label: "vinyl catcher", component: VinylCatcherWidget },
  { id: "vintage-tv", label: "vintage tv", component: VintageTV },
    { id: "equalizer-knob", label: "equalizer knob", component: EqualizerKnob },
        { id: "equalizer-horizontal", label: "equalizer horizontal", component: EqualizerHorizontal },
            { id: "equalizer-led", label: "equalizer led", component: EqualizerLed },
            { id: "equalizer-curve", label: "equalizer curve", component: EqualizerCurve },
             { id: "puzzle cover", label: "puzzle cover", component: CoverArtPuzzleWidget },
             { id: "pong", label: "pong", component: PongWidget },
             { id: "flappy-bird", label: "flappy bird", component: FlappyBirdWidget },


];