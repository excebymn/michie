export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArtist?: string
  duration: number        // seconds
  filePath: string
  artworkPath?: string    // cached thumbnail path
  trackNumber?: number
  year?: number
  genre?: string
  bitrate?: number
  sampleRate?: number
  dateAdded: number       // unix timestamp
}

export interface Album {
  id: string
  title: string
  artist: string
  artworkPath?: string
  year?: number
  trackCount: number
  tracks: Track[]
}

export interface Artist {
  name: string
  albumCount: number
  trackCount: number
}