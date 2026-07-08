import { invoke } from "./api";
import type { SongLyrics, SongLyricsSearch } from "../globalValues";
import type { LyricsLookupResult } from "../types/lyrics";

export const lyricsService = {
  getLyrics: async (songPath: string) =>
    await invoke<SongLyrics>("get_lyrics", { song_id: songPath }),
  searchRemoteLyrics: async (name: string, album: string) =>
    await invoke<SongLyricsSearch[]>("search_remote_lyrics", { name, album }),
  updateRemoteLyrics: async (
    path: string,
    syncedLyrics: string,
    plainLyrics: string,
    lyricsId: number,
  ) =>
    await invoke<void>("update_remote_lyrics", {
      path,
      synced_lyrics: syncedLyrics,
      plain_lyrics: plainLyrics,
      lyrics_id: lyricsId,
    }),
  findLyricsCandidates: async (songPath: string) =>
    await invoke<LyricsLookupResult>("find_lyrics_candidates", {
      song_id: songPath,
    }),
};
