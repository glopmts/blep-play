import { CachedSongMetadata } from "@/types/song-interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SongMetadata } from "./getSongMetadata";

const METADATA_CACHE_KEY = "song_metadata_cache_v1";

export async function getAllCachedMetadata(): Promise<
  Record<string, CachedSongMetadata>
> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function bulkCacheMetadata(
  entries: Record<string, SongMetadata>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_CACHE_KEY);
    const existing: Record<string, CachedSongMetadata> = raw
      ? JSON.parse(raw)
      : {};
    for (const [uri, meta] of Object.entries(entries)) {
      existing[uri] = {
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        genre: meta.genre,
        year: meta.year,
        track: meta.track,
      };
    }
    await AsyncStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(existing));
  } catch {}
}
