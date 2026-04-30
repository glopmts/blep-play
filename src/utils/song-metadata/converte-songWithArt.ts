import { Track } from "react-native-track-player";
import { getOrPersistCover } from "../../database/cache/coverArtCache";
import { TrackDetails } from "../../types/interfaces";

export function sanitizeArtwork(
  artwork: string | undefined,
): string | undefined {
  if (!artwork) return undefined;
  if (artwork.startsWith("file://")) return artwork;
  if (artwork.startsWith("http")) return artwork;
  if (artwork.startsWith("/")) return `file://${artwork}`;
  // base64 → inválido para notificação, descarta
  return undefined;
}

/**
 * Versão async: resolve capa do cache em disco antes de montar o Track.
 * Use sempre que possível — garante que a notificação mostra a imagem.
 */
export async function songToTrackWithArt(song: TrackDetails): Promise<Track> {
  // Tenta pegar path do cache (rápido se já existir)
  const coverPath = await getOrPersistCover(song.id, song.coverArt);

  return {
    id: song.id,
    url: song.uri,
    title: song.title?.replace(/\.[^/.]+$/, "") ?? "Música",
    artist: song.artist ?? "Artista desconhecido",
    album: song.album ?? "",
    artwork: coverPath ? `file://${coverPath}` : undefined,
    duration: song.duration / 1000, // TrackPlayer usa segundos
  };
}

// Versão síncrona — só usa se já tiver path em mãos
export function songToTrack(song: TrackDetails): Track {
  return {
    id: song.id,
    url: song.uri,
    title: song.title?.replace(/\.[^/.]+$/, "") ?? "Música",
    artist: song.artist ?? "Artista desconhecido",
    album: song.album ?? "",
    artwork: sanitizeArtwork(song.coverArt ?? undefined),
    duration: song.duration / 1000,
    coverArt: song.coverArt ?? undefined, // ✅ Campo extra para acesso posterior
  } as Track;
}
