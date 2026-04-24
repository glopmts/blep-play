// ─── Converte SongWithArt → Track

import { Track } from "react-native-track-player";
import { SongWithArt } from "../../types/interfaces";

export function sanitizeArtwork(
  artwork: string | undefined,
): string | undefined {
  if (!artwork) return undefined;
  if (artwork.startsWith("file://") || artwork.startsWith("http"))
    return artwork;
  if (artwork.startsWith("/")) return `file://${artwork}`;
  if (artwork.startsWith("data:image")) return artwork; // ← base64
  return undefined;
}

export function songToTrack(song: SongWithArt): Track {
  return {
    id: song.id,
    url: song.uri,
    title: song.filename?.replace(/\.[^/.]+$/, "") ?? "Música",
    artist: song.artist ?? "Artista desconhecido",
    album: song.albumName ?? "",
    artwork: sanitizeArtwork(song.coverArt),
    duration: song.duration,
  };
}
