import { getAlbumCover } from "@/modules/music-library.module";
import { compressAndSaveCover } from "@/services/cover-compression.service";
import { useEffect, useState } from "react";
import { getCoverUri } from "../database/cache/coverArtCache";

const memoryCache = new Map<string, string | null>();

export function useTrackCover(filePath: string | null, trackId?: string) {
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) return;

    const loadCover = async () => {
      // Usa trackId se disponível, senão usa filePath
      const cacheKey = trackId || filePath;

      // 1. Verifica cache em memória
      if (memoryCache.has(cacheKey)) {
        setCover(memoryCache.get(cacheKey)!);
        return;
      }

      // 2. Verifica cache persistente
      if (trackId) {
        const cachedUri = await getCoverUri(trackId);
        if (cachedUri) {
          const finalUri = cachedUri.startsWith("file://")
            ? cachedUri
            : `file://${cachedUri}`;
          memoryCache.set(cacheKey, finalUri);
          setCover(finalUri);
          return;
        }
      }

      // 3. Extrai do arquivo
      setLoading(true);
      try {
        const base64 = await getAlbumCover(filePath);
        if (base64 && trackId) {
          // Salva no cache persistente
          const savedPath = await compressAndSaveCover(trackId, base64);
          if (savedPath) {
            const finalUri = savedPath.startsWith("file://")
              ? savedPath
              : `file://${savedPath}`;
            memoryCache.set(cacheKey, finalUri);
            setCover(finalUri);
          }
        } else if (base64) {
          // Se não tem trackId, só mostra em memória
          setCover(`data:image/jpeg;base64,${base64}`);
        } else {
          memoryCache.set(cacheKey, null);
          setCover(null);
        }
      } catch (error) {
        console.error("Error loading cover:", error);
        setCover(null);
      } finally {
        setLoading(false);
      }
    };

    loadCover();
  }, [filePath, trackId]);

  return { cover, loading };
}

export async function getTrackCoverSync(
  filePath: string | null,
  trackId?: string,
) {
  if (!filePath) return null;

  const cacheKey = trackId || filePath;
  const memoryCache = new Map<string, string | null>();

  // 1. Verifica cache em memória
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. Verifica cache persistente
  if (trackId) {
    const cachedUri = await getCoverUri(trackId);
    if (cachedUri) {
      const finalUri = cachedUri.startsWith("file://")
        ? cachedUri
        : `file://${cachedUri}`;
      memoryCache.set(cacheKey, finalUri);
      return finalUri;
    }
  }

  // 3. Extrai do arquivo
  try {
    const base64 = await getAlbumCover(filePath);
    if (base64 && trackId) {
      const savedPath = await compressAndSaveCover(trackId, base64);
      if (savedPath) {
        const finalUri = savedPath.startsWith("file://")
          ? savedPath
          : `file://${savedPath}`;
        memoryCache.set(cacheKey, finalUri);
        return finalUri;
      }
    } else if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error) {
    console.error("Error loading cover:", error);
  }

  memoryCache.set(cacheKey, null);
  return null;
}
