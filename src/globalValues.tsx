export interface Songs {
  name: string;
  path: string;
  cover: string;
  release: string;
  track: number;
  album: string;
  artist: string;
  genre: string;
  album_artist: string;
  disc_number: number;
  duration: number;
  song_section: number;
  favorited: boolean;
}

// Struktur identik dengan `Songs` — dipertahankan sebagai tipe terpisah
// karena backend Rust mengembalikannya lewat command yang berbeda
// (get_all_songs vs command playback), dan appService/komponen Library
// sengaja membedakan nama ini secara eksplisit.
export interface SongsFull {
  name: string;
  path: string;
  cover: string;
  release: string;
  track: number;
  album: string;
  artist: string;
  genre: string;
  album_artist: string;
  disc_number: number;
  duration: number;
  song_section: number;
  favorited: boolean;
}

export interface PlayHistory {
  id: string;
  name: string;
  path: string;
  cover: string;
  release: string;
  track: number;
  album: string;
  artist: string;
  genre: string;
  album_artist: string;
  disc_number: number;
  duration: number;
  song_section: number;
  favorited: boolean;
}

export interface PlaylistFull {
  id: number;
  name: string;
  image: string;
  songs: Songs[];
}

export interface AlbumDetails {
  album: string;
  album_artist: string;
  cover: string;
  album_section: number;
}

export interface AllArtistResults {
  album_artist: string;
  name: string;
  artist_section: number;
}

export interface AllGenreResults {
  genre: string;
  genre_section: number;
}

export interface Playlists {
  id: number;
  name: string;
  image: string;
}

export interface DirectoryInfo {
  dir_path: string;
}

// Baris tabel `videos` (lihat video.rs). `DirectoryInfo` di atas dipakai
// ulang apa adanya buat `video_dirs` juga — bentuknya identik (cuma
// `dir_path`), jadi tidak perlu tipe direktori terpisah.
export interface VideoInfo {
  path: string;
  name: string;
  duration: number;
  subtitle_path: string | null;
}

export interface SongLyrics {
  lyrics_id: number;
  plain_lyrics: string;
  synced_lyrics: string;
}

export interface SongLyricsSearch {
  id: number;
  artistName: string;
  albumName: string;
  trackName: string;
  name: string;
  duration: number;
  plainLyrics: string;
  syncedLyrics: string;
  instrumental: boolean;
}


export interface TranscodeProgress {
  path: string;
  percent: number; 
}