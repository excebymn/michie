import { usePlayerStore } from '../stores/playerStore';
import { useAppearanceStore } from '../stores/appearanceStore';

let lastCover: string | null = null;

export function initColorSync() {
  console.log('[Color Sync] initColorSync started');
  usePlayerStore.subscribe((state) => {
    const cover = state.currentSong?.cover ?? null;

    // Cuma jalankan Color Engine kalau cover-nya benar-benar berubah,
    // supaya nggak re-extract warna tiap kali ada perubahan state lain
    // di playerStore (misal songProgress berubah tiap detik).
    if (cover !== lastCover) {
      lastCover = cover;
      useAppearanceStore.getState().applyColorFromCover(cover);
    }
  });
}