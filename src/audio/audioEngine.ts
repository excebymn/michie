import { Howl } from "howler"
import { usePlayerStore } from "../store/playerStore"
import type { Track } from "../types/player"

let sound: Howl | null = null

export function loadTrack(track: Track) {
  if (sound) sound.unload()

  sound = new Howl({
    src: [track.src],
    html5: true,
  })

  usePlayerStore.getState().setTrack(track)
}

export function play() {
  sound?.play()
  usePlayerStore.getState().togglePlay()
}

export function pause() {
  sound?.pause()
  usePlayerStore.getState().togglePlay()
}