export interface LrclibLyrics {
  lyrics_id: number;
  plain_lyrics: string;
  synced_lyrics: string | null;
}

export interface LyricsCandidate {
  id: number;
  trackName: string | null;
  artistName: string | null;
  albumName: string | null;
  duration: number | null;
  instrumental: boolean | null;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  confidence: number;
}

export type LyricsLookupResult =
  | { status: "cached"; lyrics: LrclibLyrics }
  | { status: "auto_matched"; lyrics: LrclibLyrics }
  | { status: "needs_selection"; candidates: LyricsCandidate[] }
  | { status: "not_found" };