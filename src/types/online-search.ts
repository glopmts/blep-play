export interface Track {
  id: number;
  title: string;
  duration: number;
  trackNumber: number;
  artist: Artist;
  album: Album;
  coverUrl: string | null;
  explicit: boolean;
  popularity: number;
}

export interface Artist {
  id: number;
  name: string;
  coverUrl: string | null;
}

export interface Album {
  id: number;
  title: string;
  releaseDate: string;
  numberOfTracks: number;
  coverUrl: string | null;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
}

export interface StreamInfo {
  streamUrl: string;
  quality: string;
  mimeType: string;
  trackId: number;
}

export interface LyricsLine {
  time: number;
  text: string;
}

export interface Lyrics {
  synced: LyricsLine[] | null;
  plain: string | null;
  trackId: number;
}

export interface SongLinks {
  spotify?: string;
  apple?: string;
  youtube?: string;
  tidal?: string;
  deezer?: string;
  amazon?: string;
}

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";
