export interface Track {
  id?: string
  title?: string
  artist?: string
  src: string
  cover?: string
}

export interface PlayerState {
  track: Track | null
  isPlaying: boolean
  currentTime: number
}