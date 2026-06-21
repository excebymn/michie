import type { Track } from './track'

// Inputs
export interface ScanFolderInput { folderPath: string }
export interface GetTracksInput { 
  sortBy?: 'title' | 'artist' | 'album' | 'dateAdded'
  order?: 'asc' | 'desc'
  search?: string
}
export interface GetArtworkInput { trackId: string }

// Outputs
export interface ScanResult { 
  added: number
  skipped: number
  errors: string[]
}
export interface ArtworkResult { 
  path: string | null 
  base64: string | null   // fallback for small art
}