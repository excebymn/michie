import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'normal' | 'work' | 'video';

interface ModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'normal',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'michie-mode',
      // Video Mode sengaja TIDAK ikut dipersist sebagai mode aktif — gak ada
      // video/queue yang "diresume" otomatis di v1 ini, jadi kalau app
      // ditutup pas lagi di Video Mode, buka lagi harus balik ke Normal
      // Mode, bukan nyangkut di video player kosong tanpa video terpilih.
      partialize: (state) => ({
        mode: state.mode === 'video' ? 'normal' : state.mode,
      }),
    },
  ),
);