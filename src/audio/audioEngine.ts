import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';
import { Track } from '../types/player';

let activeHowl: Howl | null = null;
let progressInterval: number | null = null;

const clearProgressTimer = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

const startProgressTimer = () => {
  clearProgressTimer();
  progressInterval = window.setInterval(() => {
    if (activeHowl && activeHowl.playing()) {
      usePlayerStore.getState().setCurrentTime(activeHowl.seek() as number);
    }
  }, 250); // Update tipis-tipis setiap 250ms agar pergerakan slider mulus
};

export const audioEngine = {
  loadTrack: (track: Track) => {
    clearProgressTimer();
    if (activeHowl) {
      activeHowl.unload();
    }

    const store = usePlayerStore.getState();

    activeHowl = new Howl({
      src: [track.src],
      html5: true, // Diperlukan untuk streaming file lokal berukuran besar
      volume: store.volume / 100,
      onplay: () => {
        store.setIsPlaying(true);
        startProgressTimer();
      },
      onpause: () => {
        store.setIsPlaying(false);
        clearProgressTimer();
      },
      onstop: () => {
        store.setIsPlaying(false);
        store.setCurrentTime(0);
        clearProgressTimer();
      },
      onend: () => {
        store.setIsPlaying(false);
        clearProgressTimer();
        // Logika auto-next berdasarkan repeatMode bisa disuntikkan di sini nanti
      },
      onseek: () => {
        if (activeHowl) {
          store.setCurrentTime(activeHowl.seek() as number);
        }
      }
    });

    store.setTrack(track);
    store.setCurrentTime(0);
  },

  play: () => {
    if (activeHowl) activeHowl.play();
  },

  pause: () => {
    if (activeHowl) activeHowl.pause();
  },

  seek: (seconds: number) => {
    if (activeHowl) activeHowl.seek(seconds);
  },

  setVolume: (volume: number) => {
    usePlayerStore.getState().setVolume(volume);
    if (activeHowl) activeHowl.volume(volume / 100);
  }
};