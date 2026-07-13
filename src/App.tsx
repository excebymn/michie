import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import { appService, playerService } from "./services";
import { useAppStore, usePlayerStore } from "./stores";
import { useAppearanceStore } from "./stores/appearanceStore";
import MainLayout from "./layout";

function App() {
  const loadInitialData = useAppStore((state) => state.loadInitialData);
  const refreshLibrary = useAppStore((state) => state.refreshLibrary);
  const refreshPlaylists = useAppStore((state) => state.refreshPlaylists);
  const setScanning = useAppStore((state) => state.setScanning);
  const setScanProgress = useAppStore((state) => state.setScanProgress);
  const loadPlayerState = usePlayerStore((state) => state.loadPlayerState);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setShuffleModeState = usePlayerStore(
    (state) => state.setShuffleModeState,
  );

  useEffect(() => {
    loadInitialData();
    loadPlayerState();
    // terapkan tema, palet warna, dan background yang tersimpan
    // sebelum user sempat lihat tampilan default
    useAppearanceStore.getState().hydrate();
  }, [loadInitialData, loadPlayerState]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const bindEvents = async () => {
      cleanups.push(
        await appService.onScanFinished(async () => {
          await refreshLibrary();
          setScanning(false);
          setScanProgress(0, 0);
        }),
      );
      cleanups.push(
        await appService.onScanStarted(() => {
          setScanning(true);
          setScanProgress(0, 0);
        }),
      );
      cleanups.push(
        await appService.onScanProgress((event) => {
          setScanProgress(event.payload.current, event.payload.length);
        }),
      );
      cleanups.push(await appService.onRestoreFinished(loadInitialData));
      cleanups.push(await appService.onResetFinished(loadInitialData));
      cleanups.push(await appService.onPlaylistCreated(refreshPlaylists));
      cleanups.push(
        await playerService.onCurrentSong((event) => {
          setCurrentSong(event.payload.q);
        }),
      );
      cleanups.push(
        await playerService.onControlsPlayPause((event) => {
          setIsPlaying(event.payload);
        }),
      );
      cleanups.push(
        await playerService.onShuffleMode((event) => {
          setShuffleModeState(event.payload);
        }),
      );
    };
    bindEvents();
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell app-root michie-box">
        <MainLayout />
      </div>
    </BrowserRouter>
  );
}

export default App;