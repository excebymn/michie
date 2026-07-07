import { invoke, onEvent, type EventHandler } from "./api";
import type { Songs } from "../globalValues";

export const playerService = {
  play: async () => await invoke<void>("player_play"),
  pause: async () => await invoke<void>("player_pause"),
  nextSong: async () => await invoke<void>("player_next_song"),
  previousSong: async () => await invoke<void>("player_previous_song"),
  stop: async () => await invoke<void>("player_stop"),
  setVolume: async (volume: number) =>
    await invoke<void>("player_set_volume", { volume }),
  setRepeatMode: async (mode: number) =>
    await invoke<void>("player_set_repeat_mode", { mode }),
  setShuffleMode: async (shuffled: boolean) =>
    await invoke<void>("set_shuffle_mode", { mode: shuffled }),
  seek: async (pos: number) => {
    const normalizedPos = Number.isFinite(pos)
      ? Math.max(0, Math.round(pos))
      : 0;
    await invoke<void>("player_set_seek", { pos: normalizedPos });
  },
  getCurrentSong: async () => await invoke<Songs>("player_get_current_song"),
  getCurrentPosition: async () =>
    await invoke<number>("player_get_current_position"),
  getCurrentIndex: async () => await invoke<number>("player_get_current_index"),
  getQueue: async (shuffled: boolean) =>
    await invoke<Songs[]>("get_queue", { shuffled }),
  getQueueLength: async () => await invoke<number>("player_get_queue_length"),
  getSinkLength: async () => await invoke<number>("player_get_sink_length"),
  loadSong: async (index: number) =>
    await invoke<void>("player_load_song", { index }),
  updateCurrentSongPlayed: async () =>
    await invoke<void>("update_current_song_played"),
  updatePosition: async (index: number) =>
    await invoke<void>("player_update_pos", { index }),
  shuffleQueue: async (song: string, shuffled: boolean) =>
    await invoke<void>("shuffle_queue", { song, shuffled }),
  addSongToHistory: async (path: string) =>
    await invoke<void>("add_song_to_history", { path }),
  clearQueue: async () => await invoke<void>("player_clear_queue"),
  playSong: async (song: Songs) => {
    await invoke<void>("play_song", { song });
    await playerService.setShuffleMode(false);
  },
  playAlbum: async (album_name: string, index: number, shuffled: boolean) => {
    await invoke<void>("play_album", { album_name, index, shuffled });
    await playerService.setShuffleMode(shuffled);
  },
  playPlaylist: async (
    playlist_id: number,
    index: number,
    shuffled: boolean,
  ) => {
    await invoke<void>("play_playlist", { playlist_id, index, shuffled });
    await playerService.setShuffleMode(shuffled);
  },
  playSelection: async (songs: Songs[], shuffled: boolean = false) => {
    await invoke<void>("play_selection", { songs, shuffled });
    await playerService.setShuffleMode(shuffled);
  },
  playArtist: async (album_artist: string, shuffled: boolean) => {
    await invoke<void>("play_artist", { album_artist, shuffled });
    await playerService.setShuffleMode(shuffled);
  },
  playGenre: async (genre: string, shuffled: boolean) => {
    await invoke<void>("play_genre", { genre, shuffled });
    await playerService.setShuffleMode(shuffled);
  },
  addToQueue: async (songs: Songs[]) =>
    await invoke<void>("add_to_queue", { songs }),
  playerAddToQueue: async (queue: Songs[]) =>
    await invoke<void>("player_add_to_queue", { queue }),
  loadAlbumSong: async (queue: Songs[], index: number) =>
    await invoke<void>("player_load_album", { queue, index }),
  setupQueueAndSong: async (queue: Songs[], index: number) =>
    await invoke<void>("player_setup_queue_and_song", { queue, index }),
  getSong: async (song_path: string) =>
    await invoke<Songs>("get_song", { song_path }),
  getAlbum: async (name: string) =>
    await invoke<Songs[]>("get_album", { name }),

  // ---- Queue widget: tambah / putar berikutnya / hapus / urutkan ulang / loncat ----
  addToQueueEnd: async (songs: Songs[], shuffled: boolean) =>
    await invoke<void>("queue_add_to_end", { songs, shuffled }),
  playNext: async (songs: Songs[], shuffled: boolean) =>
    await invoke<void>("queue_play_next", { songs, shuffled }),
  removeFromQueue: async (index: number, shuffled: boolean) =>
    await invoke<void>("queue_remove_at", { index, shuffled }),
  reorderQueue: async (fromIndex: number, toIndex: number, shuffled: boolean) =>
    await invoke<void>("queue_reorder", {
      from_index: fromIndex,
      to_index: toIndex,
      shuffled,
    }),
  jumpToQueueIndex: async (index: number) =>
    await invoke<void>("queue_jump_to", { index }),

  onCurrentSong: async (handler: EventHandler<{ q: Songs }>) =>
    await onEvent("get-current-song", handler),
  onUpdateSong: async (handler: EventHandler<{ dir_path: string }>) =>
    await onEvent("update-song", handler),
  onQueueCleared: async (handler: EventHandler<void>) =>
    await onEvent("queue-cleared", handler),
  onQueueChanged: async (handler: EventHandler<void>) =>
    await onEvent("queue-changed", handler),
  onControlsPlayPause: async (handler: EventHandler<boolean>) =>
    await onEvent("controls-play-pause", handler),
  onShuffleMode: async (handler: EventHandler<boolean>) =>
    await onEvent("player-shuffle-mode", handler),
};
