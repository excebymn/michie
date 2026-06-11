import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  List,
  Shuffle,
  Heart,
  Repeat,
  Repeat1,
  X,
  ChevronUp,
  Volume2,
  Music,
  FolderOpen,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { audioEngine } from '../../audio/audioEngine';
import { Track } from '../../types/player';

// ── INTEGRASI NATIVE TAURI ──
// Mendukung Tauri v1 & v2 (Menyesuaikan dengan dependensi yang Anda pasang)
import { open } from '@tauri-apps/plugin-dialog'; // atau '@tauri-apps/api/dialog' di v1
import { readDir } from '@tauri-apps/plugin-fs';    // atau '@tauri-apps/api/fs' di v1
import { convertFileSrc } from '@tauri-apps/api/core'; // atau '@tauri-apps/api/tauri' di v1

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '00.00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}.${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const {
    track,
    isPlaying,
    currentTime,
    volume,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    likedTracks,
    selectedFolder,
    setQueue,
    setCurrentIndex,
    toggleShuffle,
    setRepeatMode,
    toggleLikeTrack,
    setSelectedFolder,
  } = usePlayerStore();

  const [showPopup, setShowPopup] = useState(false);

  const currentTrack = track || queue[currentIndex];
  const isLiked = currentTrack ? likedTracks.includes(currentTrack.id) : false;

  // ── HANDLER PILIH FOLDER ASLI (TAURI INTEGRATION) ──
  const handleSelectFolder = async () => {
    try {
      // 1. Buka Native Dialog Pencarian Folder
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select your Music Library Folder'
      });

      if (!selected || typeof selected !== 'string') return;
      setSelectedFolder(selected);

      // 2. Baca isi file di dalam folder tersebut
      const entries = await readDir(selected);
      
      // Filter hanya file audio standar (mp3, flac, wav, m4a, ogg)
      const audioExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg'];
      const audioFiles = entries.filter(entry => 
        entry.name && audioExtensions.some(ext => entry.name!.toLowerCase().endsWith(ext))
      );

      if (audioFiles.length === 0) {
        alert('No supported audio files found in this folder.');
        return;
      }

      // 3. Mapping data file lokal ke format Track milik Michie
      const localTracks: Track[] = audioFiles.map((file, idx) => {
        // Gabungkan path folder dengan nama file secara aman (sesuai OS)
        const separator = selected.includes('\\') ? '\\' : '/';
        const fullPath = `${selected}${separator}${file.name}`;
        
        // Bersihkan ekstensi file untuk dijadikan judul sementara
        const titleClean = file.name!.replace(/\.[^/.]+$/, "");

        return {
          id: `local-${idx}-${Date.now()}`,
          title: titleClean,
          artist: 'Local Track',
          album: 'Local Album',
          // CRITICAL: Mengubah path sistem internal komputer menjadi aman untuk browser/Howler
          src: convertFileSrc(fullPath), 
          cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop', // Placeholder cover default
          duration: 0, // Akan di-update dinamis oleh Howler saat dimuat
          sampleRate: 'Local',
          bitrate: 'Audio',
          format: file.name!.split('.').pop() || 'unknown'
        };
      });

      // 4. Masukkan ke Antrean Global & Putar Lagu Pertama
      setQueue(localTracks);
      setCurrentIndex(0);
      audioEngine.loadTrack(localTracks[0]);
      audioEngine.play();

    } catch (error) {
      console.error("Gagal memuat library musik lokal:", error);
    }
  };

  // ── CONTROLLER HANDLERS ──
  const handlePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const newIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    audioEngine.loadTrack(queue[newIndex]);
    audioEngine.play();
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const newIndex = currentIndex === queue.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    audioEngine.loadTrack(queue[newIndex]);
    audioEngine.play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    audioEngine.seek(time);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentIndex(index);
    audioEngine.loadTrack(queue[index]);
    audioEngine.play();
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const progressPercent = currentTrack && currentTrack.duration > 0 
    ? (currentTime / currentTrack.duration) * 100 
    : 0;

  return (
    /* Poin 1 & 5: bg-white & shadow-2xl dibuang! 
      Sekarang full transparan, ukuran flex-1/h-full mengikuti container MainLayout.
    */
    <div className="relative w-full h-full mx-auto p-5 flex flex-col justify-between select-none text-white bg-transparent">
      
      {/* ── TOP BAR: Info Folder Sumber Library ── */}
      <div className="mb-4 flex items-center justify-between border-b border-neutral-800/60 pb-3">
        <div className="flex items-center gap-2 text-neutral-400 min-w-0">
          <FolderOpen size={14} className="shrink-0" />
          <span className="text-[11px] font-semibold truncate max-w-[180px]">
            {selectedFolder ? selectedFolder.split(/[\\/]/).pop() : 'No Library Loaded'}
          </span>
        </div>
        <button 
          onClick={handleSelectFolder}
          className="text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1 rounded-full transition-colors border border-neutral-700/50"
        >
          Select Folder
        </button>
      </div>

      {/* if no tracks loaded state */}
      {!currentTrack ? (
        <div className="my-auto flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
          <Music size={32} className="text-neutral-600 mb-2 animate-pulse" />
          <p className="text-xs font-semibold text-neutral-400">Your queue is empty</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Click 'Select Folder' to load local tracks.</p>
        </div>
      ) : (
        <>
          {/* ── ALBUM COVER ART ── */}
          <div className="relative aspect-square w-full max-w-[250px] mx-auto overflow-hidden rounded-[20px] bg-neutral-800 shadow-xl border border-neutral-800/50">
            <img
              src={currentTrack.cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500"
              style={{ transform: isPlaying ? 'scale(1.02)' : 'scale(1)' }}
            />
          </div>

          {/* ── TRACK INFO ROW ── */}
          <div className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[20px] font-bold leading-tight tracking-tight text-white">
                {currentTrack.title}
              </h2>
              <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-400">
                {currentTrack.artist} {currentTrack.album !== 'Local Album' && `— ${currentTrack.album}`}
              </p>
            </div>

            <button
              onClick={() => setShowPopup(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition-transform active:scale-95 hover:bg-neutral-200"
            >
              <List size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── PROGRESS BAR ── */}
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={currentTrack.duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="music-range h-1 w-full cursor-pointer bg-neutral-800"
              style={{
                background: `linear-gradient(to right, #ffffff ${progressPercent}%, #262626 ${progressPercent}%)`,
              }}
            />
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-neutral-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          {/* ── PLAYBACK CONTROLS ── */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              className="flex h-10 w-14 items-center justify-center rounded-full bg-neutral-800/60 text-neutral-300 transition-all hover:bg-neutral-700 active:scale-95"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            <button
              onClick={handlePlayPause}
              className="flex h-[52px] w-[64px] items-center justify-center rounded-[16px] bg-white text-neutral-950 shadow-md transition-all hover:bg-neutral-100 active:scale-95"
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="flex h-10 w-14 items-center justify-center rounded-full bg-neutral-800/60 text-neutral-300 transition-all hover:bg-neutral-700 active:scale-95"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>

          {/* ── METADATA SPECS BAR ── */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wider text-neutral-500 border-t border-neutral-900 pt-3">
            <span>{currentTrack.sampleRate}</span>
            <span className="text-neutral-800">|</span>
            <span>{currentTrack.bitrate}</span>
            <span className="text-neutral-800">|</span>
            <span className="uppercase text-neutral-400">{currentTrack.format}</span>
          </div>

          {/* ── OPTIONS TRIGGER ── */}
          <button
            onClick={() => setShowPopup(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-800/40 border border-neutral-800/60 py-2 text-[11px] font-semibold text-neutral-400 transition-colors hover:bg-neutral-800"
          >
            <ChevronUp size={12} />
            <span>More Options & Queue</span>
          </button>
        </>
      )}

      {/* ── MODAL POPUP (Telah Disulap Menjadi Dark Theme Elegan & Proporsional) ── */}
      {showPopup && currentTrack && (
        <>
          <div
            className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm rounded-[24px]"
            onClick={() => setShowPopup(false)}
          />

          <div className="popup-container absolute top-1/2 left-1/2 z-50 w-[92%] max-w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-neutral-900 border border-neutral-800 p-4 shadow-2xl flex flex-col max-h-[90%] text-white">
            
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Music size={13} className="text-neutral-500" />
                Now Playing Options
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-950 p-1.5">
              <button
                onClick={toggleShuffle}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all flex-1 ${
                  isShuffled ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Shuffle size={14} />
                <span className="text-[9px] font-bold">Shuffle</span>
              </button>

              <button
                onClick={() => toggleLikeTrack(currentTrack.id)}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all flex-1 ${
                  isLiked ? 'text-red-500 bg-red-950/30' : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-[9px] font-bold">Like</span>
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all flex-1 ${
                  repeatMode !== 'off' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {repeatMode === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
                <span className="text-[9px] font-bold uppercase">{repeatMode}</span>
              </button>
            </div>

            {/* Volume */}
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-neutral-950 px-3 py-2">
              <Volume2 size={14} className="text-neutral-500" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => audioEngine.setVolume(Number(e.target.value))}
                className="music-range h-1 flex-1 cursor-pointer bg-neutral-800"
                style={{
                  background: `linear-gradient(to right, #ffffff ${volume}%, #262626 ${volume}%)`,
                }}
              />
            </div>

            {/* Queue List */}
            <div className="mt-3 flex-1 flex flex-col min-h-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Queue ({queue.length})</p>
              <div className="playlist-scroll space-y-0.5 overflow-y-auto pr-0.5 flex-1 max-h-[160px]">
                {queue.map((t, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleTrackSelect(idx);
                        setShowPopup(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                        isActive ? 'bg-white text-neutral-950 font-bold' : 'hover:bg-neutral-800/60 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{t.title}</p>
                      </div>
                      <span className="text-[9px] opacity-50 shrink-0">{formatTime(t.duration)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── STYLES ── */}
      <style>{`
        @keyframes popIn {
          from { transform: translate(-50%, -46%) scale(0.96); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
        }
        .popup-container {
          animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .music-range {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          border-radius: 9999px;
        }
        .music-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
        }
        .playlist-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .playlist-scroll::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}