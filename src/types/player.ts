export type RepeatMode = 'none' | 'one' | 'all'
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerState {
  status: PlaybackStatus
  currentTrack: import('./track').Track | null
  position: number       // seconds
  duration: number       // seconds
  volume: number         // 0–1
  isMuted: boolean
  shuffle: boolean
  repeat: RepeatMode
}