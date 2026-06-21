import { useEffect } from 'react'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useDynamicTheme } from './hooks/useDynamicTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useLibraryStore } from './store/useLibraryStore'
import { getTracks } from './lib/tauri-bridge'
import './App.css'

//import LibraryView from './components/library/LibraryView'
//import NowPlayingPanel from './components/now-playing/NowPlayingPanel'
//import PlayerBar from './components/player/PlayerBar'
//import QueuePanel from './components/queue/QueuePanel'

export default function App() {
  const audioEngine = useAudioEngine()
  const { setTracks } = useLibraryStore()

  useDynamicTheme()
  useKeyboardShortcuts(audioEngine)

  useEffect(() => {
    getTracks().then(setTracks).catch(console.error)
  }, [])

  return (
    <div className="app-layout">
      <aside className="sidebar-nav surface-1">
        {/* Navigation: Library, Playlists, Settings */}
      </aside>

      <main className="main-content">
        <LibraryView audioEngine={audioEngine} />
      </main>

      <aside className="now-playing surface">
        <NowPlayingPanel />
        <QueuePanel />
      </aside>

      <footer className="player-bar surface-2">
        <PlayerBar audioEngine={audioEngine} />
      </footer>
    </div>
  )
}