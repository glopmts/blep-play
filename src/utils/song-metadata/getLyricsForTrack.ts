import { musicCache } from "../../database/music-cache";
import { fetchLyricsOnline } from "../../services/lyrics.service";
import { getSongMetadata } from "./getSongMetadata";

interface LyricsOptions {
  trackId: string;
  filePath: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // segundos (number)
  online?: boolean; // se deve tentar busca online
}

export async function getLyricsForTrack(
  opts: LyricsOptions,
): Promise<string | undefined> {
  const { trackId, filePath, title, artist, album, duration, online } = opts;

  // 1. Cache SQLite
  const cached = await musicCache.getLyrics(trackId);
  if (cached) return cached;

  // 2. Busca online (se conectado)
  if (online) {
    const remote = await fetchLyricsOnline(title, artist, album, duration);
    if (remote) {
      await musicCache.updateLyrics(trackId, remote);
      return remote;
    }
  }

  // 3. Lê do arquivo (ID3/FLAC)
  const meta = await getSongMetadata(filePath);
  if (!meta.lyrics) return undefined;

  await musicCache.updateLyrics(trackId, meta.lyrics);
  return meta.lyrics;
}
