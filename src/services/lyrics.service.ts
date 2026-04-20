// Usa a API lrclib.net — gratuita, sem key, retorna letras sincronizadas e planas
const LRCLIB_BASE = "https://lrclib.net/api";

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string; // letra sem timestamp
  syncedLyrics: string; // letra com [mm:ss.xx] para karaokê
}

export async function fetchLyricsOnline(
  title: string,
  artist: string,
  album?: string,
  duration?: number,
): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      ...(album ? { album_name: album } : {}),
      ...(duration ? { duration: String(Math.round(duration)) } : {}),
    });

    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: { "Lrclib-Client": "MeuAppMusica/1.0" },
    });

    if (!res.ok) return undefined;

    const data: LrclibResponse = await res.json();
    return data.plainLyrics || data.syncedLyrics || undefined;
  } catch {
    return undefined;
  }
}
