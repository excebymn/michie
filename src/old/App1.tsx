import { Routes, Route, BrowserRouter } from "react-router-dom";
import { useEffect } from "react";

import "./App.css";

import { appService, playerService } from "./services";
import { useAppStore, usePlayerStore } from "./stores";

// Custom Components
import CustomWindowsBar from "./components/fileSystem/customWindowsBar";
import MusicControls from "./components/musicControls";
import RightSideBar from "./components/rightSideBar";
import Popup from "./components/popups";

// Pages
import PlaylistOverviewPage from "./pages/details/playlistDetails";
import ArtistOverviewPage from "./pages/details/artistDetails";
import LRCLIBSearchResults from "./pages/lyrics/LRCLIBSearch";
import AlbumOverviewPage from "./pages/details/albumDetails";
import GenreOverviewPage from "./pages/details/genreDetails";
import SongLyricSearch from "./pages/lyrics/lyricSearch";
import QueueOverviewPage from "./pages/queue";
import PlayHistoryPage from "./pages/history";
import PlaylistPage from "./pages/playlist";
import ArtistsPage from "./pages/artists";
import GenresPage from "./pages/genres";
import Settings from "./pages/settings";
import AlbumPage from "./pages/albums";
import SongPage from "./pages/songs";
import Home from "./pages/home";

function App() {
  const songs = useAppStore((state) => state.songList);
  const albums = useAppStore((state) => state.albumList);
  const artists = useAppStore((state) => state.artistList);
  const genres = useAppStore((state) => state.genreList);
  const newVersionAvailable = useAppStore((state) => state.newVersionAvailable);
  const loadInitialData = useAppStore((state) => state.loadInitialData);
  const refreshLibrary = useAppStore((state) => state.refreshLibrary);
  const refreshPlaylists = useAppStore((state) => state.refreshPlaylists);
  const setScanning = useAppStore((state) => state.setScanning);
  const setScanProgress = useAppStore((state) => state.setScanProgress);

  const loadPlayerState = usePlayerStore((state) => state.loadPlayerState);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setShuffleModeState = usePlayerStore((state) => state.setShuffleModeState);

  useEffect(() => {
    loadInitialData();
    loadPlayerState();
  }, [loadInitialData, loadPlayerState]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const bindEvents = async () => {
      cleanups.push(await appService.onScanFinished(async () => {
        await refreshLibrary();
        setScanning(false);
        setScanProgress(0, 0);
      }));

      cleanups.push(await appService.onScanStarted(() => {
        setScanning(true);
        setScanProgress(0, 0);
      }));

      cleanups.push(await appService.onScanProgress((event) => {
        setScanProgress(event.payload.current, event.payload.length);
      }));

      cleanups.push(await appService.onRestoreFinished(async () => {
        await loadInitialData();
      }));

      cleanups.push(await appService.onResetFinished(async () => {
        await loadInitialData();
      }));

      cleanups.push(await appService.onPlaylistCreated(async () => {
        await refreshPlaylists();
      }));

      cleanups.push(await playerService.onCurrentSong((event) => {
        setCurrentSong(event.payload.q);
      }));

      cleanups.push(await playerService.onControlsPlayPause((event) => {
        setIsPlaying(event.payload);
      }));

      cleanups.push(await playerService.onShuffleMode((event) => {
        setShuffleModeState(event.payload);
      }));
    };

    bindEvents();

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [refreshLibrary, refreshPlaylists, loadInitialData, setScanning, setScanProgress, setCurrentSong, setIsPlaying, setShuffleModeState]);

  return (
    <div>
      <BrowserRouter>
        <CustomWindowsBar />
        <RightSideBar />
        <MusicControls />
        <div className="content">
          {newVersionAvailable && <Popup isToggled={newVersionAvailable} popupType={0} />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/songs" element={<SongPage songs={songs} />} />
            <Route path="/albums" element={<AlbumPage albums={albums} />} />
            <Route path="/artists" element={<ArtistsPage artists={artists} />} />
            <Route path="/genres" element={<GenresPage genres={genres} />} />
            <Route path="/queue" element={<QueueOverviewPage />} />
            <Route path="/history" element={<PlayHistoryPage />} />
            <Route path="/playlists" element={<PlaylistPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/albums/overview" element={<AlbumOverviewPage />} />
            <Route path="/artists/overview" element={<ArtistOverviewPage />} />
            <Route path="/genres/overview" element={<GenreOverviewPage />} />
            <Route path="/playlists/overview" element={<PlaylistOverviewPage />} />
            <Route path="/lyrics/song-search" element={<SongLyricSearch songs={songs} />} />
            <Route path="/lyrics/lrclib-results" element={<LRCLIBSearchResults />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
