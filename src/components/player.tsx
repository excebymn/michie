import { usePlayerStore } from "../store/playerStore"
import { play, pause } from "../audio/audioEngine"

export default function Player() {
  const { track, isPlaying } = usePlayerStore()

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl font-bold">Michie</h1>

      {track && (
        <p className="mt-2 text-sm opacity-70">
          {track.title ?? track.src}
        </p>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-500 rounded"
        onClick={() => (isPlaying ? pause() : play())}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  )
}