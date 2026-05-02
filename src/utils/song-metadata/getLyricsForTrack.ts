import { musicCache } from "../../database/music-cache";
import { getSongMetadata } from "./getSongMetadata";

export async function getLyricsForTrack(
  trackId: string,
  filePath: string,
): Promise<string | undefined> {
  // 1. Cache SQLite — só o campo lyrics, sem carregar a track inteira
  const cached = await musicCache.getLyrics(trackId);

  if (cached) return cached;

  // 2. Lê do arquivo (ID3/FLAC)
  const meta = await getSongMetadata(filePath);
  if (!meta.lyrics) return undefined;

  await musicCache.updateLyrics(trackId, meta.lyrics);

  return meta.lyrics;
}
