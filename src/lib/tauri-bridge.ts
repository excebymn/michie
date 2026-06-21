import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { Track } from '../types/track'
import type { ScanResult, GetTracksInput, ArtworkResult } from '../types/tauri-commands'

export async function scanFolder(folderPath: string): Promise<ScanResult> {
  return invoke('scan_folder', { folderPath })
}

export async function getTracks(opts: GetTracksInput = {}): Promise<Track[]> {
  return invoke('get_tracks', opts)
}

export async function deleteTrack(trackId: string): Promise<void> {
  return invoke('delete_track', { trackId })
}

export async function getArtwork(trackId: string): Promise<ArtworkResult> {
  return invoke('get_artwork', { trackId })
}

export async function pickFolder(): Promise<string | null> {
  return open({ directory: true, multiple: false }) as Promise<string | null>
}

export async function pickAudioFiles(): Promise<string[]> {
  const result = await open({
    multiple: true,
    filters: [{ name: 'Audio', extensions: ['mp3','flac','aac','ogg','wav','m4a','opus'] }]
  })
  if (!result) return []
  return Array.isArray(result) ? result : [result]
}