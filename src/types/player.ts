export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  src: string;         // Lokasi file (URL atau path lokal dari Tauri)
  cover?: string;      // URL gambar album art
  duration: number;    // Dalam detik
  sampleRate?: string; // Contoh: "96kHz"
  bitrate?: string;    // Contoh: "1411kbps"
  format?: string;     // Contoh: "flac"
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  likedTracks: string[]; // Menyimpan array ID track yang disukai
  selectedFolder: string | null;
}