import { invoke } from "./api";
import type { Playlists, PlaylistFull, Songs } from "../globalValues";

export const playlistService = {
  getAllPlaylists: async () => await invoke<Playlists[]>("get_all_playlists"),
  getPlaylist: async (id: number) =>
    await invoke<PlaylistFull>("get_playlist", { id }),
  createPlaylist: async (name: string) =>
    await invoke<void>("create_playlist", { name }),
  addToPlaylist: async (songs: Songs[], playlistId: number) =>
    await invoke<void>("add_to_playlist", { songs, playlist_id: playlistId }),
  addToPlaylistByName: async (songs: Songs[], playlistName: string) =>
    await invoke<void>("add_to_playlist", {
      songs,
      playlist_name: playlistName,
    }),
  deletePlaylist: async (name: string) =>
    await invoke<void>("delete_playlist", { name }),
  renamePlaylist: async (oldName: string, newName: string) =>
    await invoke<void>("rename_playlist", {
      old_name: oldName,
      new_name: newName,
    }),
  reorderPlaylist: async (
    playlistId: number,
    songPath: string,
    start: number,
    end: number,
  ) =>
    await invoke<void>("reorder_playlist", {
      playlist_id: playlistId,
      song_path: songPath,
      start,
      end,
    }),
  removeSongFromPlaylist: async (
    playlistId: number,
    songPath: string,
    songs: Songs[],
  ) =>
    await invoke<void>("remove_song_from_playlist", {
      playlist_id: playlistId,
      song_path: songPath,
      songs,
    }),
  removeMultipleSongsFromPlaylist: async (playlistId: number, songs: Songs[]) =>
    await invoke<void>("remove_multiple_songs_from_playlist", {
      playlist_id: playlistId,
      songs,
    }),
  emitPlaylistAdded: async () => await invoke<void>("new_playlist_added"),
};
