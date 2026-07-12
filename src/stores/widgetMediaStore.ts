import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetMediaKind } from "../services/widgetMediaService";

// Nyimpen RAW filesystem path (hasil save_widget_media di Rust, sudah
// di-copy ke folder app) — bukan asset URL, karena convertFileSrc() murah
// dipanggil ulang kapan pun dibutuhkan di komponen, sementara path mentahnya
// yang perlu di-persist supaya foto/gif/video custom kepilih lagi otomatis
// tiap app dibuka ulang (sesuai konvensi persist di widgetLayoutStore.ts).
interface WidgetMediaState {
  photoPath: string | null;
  gifPath: string | null;
  videoPath: string | null;
  setMediaPath: (kind: WidgetMediaKind, path: string) => void;
  clearMediaPath: (kind: WidgetMediaKind) => void;
}

const KEY_BY_KIND: Record<WidgetMediaKind, keyof Pick<WidgetMediaState, "photoPath" | "gifPath" | "videoPath">> = {
  photo: "photoPath",
  gif: "gifPath",
  video: "videoPath",
};

export const useWidgetMediaStore = create<WidgetMediaState>()(
  persist(
    (set) => ({
      photoPath: null,
      gifPath: null,
      videoPath: null,

      setMediaPath: (kind, path) =>
        set({ [KEY_BY_KIND[kind]]: path }),

      clearMediaPath: (kind) =>
        set({ [KEY_BY_KIND[kind]]: null }),
    }),
    {
      name: "michie-widget-media",
    },
  ),
);