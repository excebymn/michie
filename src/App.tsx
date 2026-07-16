import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import { appService, playerService } from "./services";
import { useAppStore, usePlayerStore } from "./stores";
import { useAppearanceStore } from "./stores/appearanceStore";
import MainLayout from "./layout";
import LoadingScreen from "./components/LoadingScreen";

// Waktu minimum overlay tampil, biar animasi vinyl gak kepotong kalau
// kebetulan loadInitialData/loadPlayerState selesai super cepat.
const MIN_BOOT_MS = 1800;
// Harus sinkron sama durasi transition opacity di LoadingScreen.css.
const EXIT_TRANSITION_MS = 400;

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

  // showLoadingScreen: overlay masih ada di DOM sama sekali
  // isExiting: overlay lagi fade-out (masih di DOM, animasi jalan)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const bootStart = performance.now();

    // Terapkan tema/palette/background duluan (paling awal, sebelum nunggu
    // data lain) supaya <link> CSS tema sempat ke-load selama animasi boot
    // jalan, bukan pop begitu overlay udah ilang.
    useAppearanceStore.getState().hydrate();

    (async () => {
      try {
        await Promise.all([loadInitialData(), loadPlayerState()]);
      } finally {
        const elapsed = performance.now() - bootStart;
        const remaining = Math.max(0, MIN_BOOT_MS - elapsed);
        window.setTimeout(() => {
          if (!cancelled) setIsExiting(true);
        }, remaining);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadInitialData, loadPlayerState]);

  // Lepas overlay dari DOM setelah transition fade-out beneran selesai.
  useEffect(() => {
    if (!isExiting) return;
    const t = window.setTimeout(
      () => setShowLoadingScreen(false),
      EXIT_TRANSITION_MS,
    );
    return () => window.clearTimeout(t);
  }, [isExiting]);

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
      <div className="app-shell app-root">
        <MainLayout />
        {showLoadingScreen && <LoadingScreen exiting={isExiting} />}
      </div>
    </BrowserRouter>
  );
}

export default App;