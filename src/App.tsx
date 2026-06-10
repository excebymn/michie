import { useState } from "react"
import Player from "./components/player.tsx"

function App() {
  const [appReady] = useState(true)

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col">
      
      {/* TOP BAR (optional future widget area) */}
      <div className="h-10 flex items-center px-4 border-b border-white/10">
        <p className="text-sm text-gray-400">Michie</p>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex items-center justify-center">
        
        {appReady ? (
          <Player />
        ) : (
          <p className="text-gray-500">Loading Michie...</p>
        )}

      </div>

    </div>
  )
}

export default App