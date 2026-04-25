import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearAlbumsCache,
  persistAlbumsMeta,
  readAlbumsMeta,
} from "../database/cache/albuns-cache";
import { AlbumWithDetails } from "../types/interfaces";
import { fetchAndCacheCover, getCoverUri } from "../utils/coverArtCache";

const CACHE_TTL = 30 * 60 * 1000; // 30 min

// Cache em memória
const memoryAlbums = new Map<string, AlbumWithDetails>();

// Verificar se cache expirou
function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

const priorityQueue = new Set<string>();
const normalQueue = new Set<string>();
const albumCoverSongMap = new Map<string, string>();

async function getMostRecentSongFromAlbum(
  albumId: string,
): Promise<MediaLibrary.Asset | null> {
  try {
    const assets = await MediaLibrary.getAssetsAsync({
      album: albumId,
      mediaType: ["audio"],
      first: 1,
      sortBy: [[MediaLibrary.SortBy.modificationTime, false]],
    });

    return assets.assets[0] || null;
  } catch (error) {
    console.error(
      `Error getting most recent song from album ${albumId}:`,
      error,
    );
    return null;
  }
}

export const useAlbum = () => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const isMounted = useRef(true);
  const abortRef = useRef(false);
  const processingRef = useRef(false);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const onAlbumsVisible = useCallback((visibleIds: string[]) => {
    visibleIds.forEach((id) => {
      priorityQueue.add(id);
      normalQueue.delete(id);
    });
    if (!processingRef.current) processCoverQueue();
  }, []);

  //  PROCESSAMENTO DE CAPAS ATUALIZADO
  const processCoverQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const drainQueue = async (queue: Set<string>) => {
      for (const albumId of [...queue]) {
        if (abortRef.current) break;
        queue.delete(albumId);

        // Busca a capa mais recente (baseada na última música)
        const existing = await getCoverUri(albumId);

        // Verifica se a capa atual é da música mais recente
        const updatedCover = await updateAlbumCover(albumId, existing);

        if (updatedCover && isMounted.current) {
          setAlbums((prev) =>
            prev.map((a) =>
              a.id === albumId ? { ...a, coverArt: updatedCover } : a,
            ),
          );
        }

        await new Promise((r) => setTimeout(r, 30));
      }
    };

    while (priorityQueue.size > 0 || normalQueue.size > 0) {
      if (priorityQueue.size > 0) {
        await drainQueue(priorityQueue);
      } else {
        await drainQueue(normalQueue);
      }
    }

    processingRef.current = false;
    if (isMounted.current) setLoadingCovers(false);
  }, []);

  //  FUNÇÃO PARA ATUALIZAR CAPA DO ÁLBUM
  async function updateAlbumCover(
    albumId: string,
    currentCoverUri?: string,
  ): Promise<string | undefined> {
    try {
      // Busca a música mais recente
      const mostRecentSong = await getMostRecentSongFromAlbum(albumId);

      if (!mostRecentSong?.uri) {
        return currentCoverUri;
      }

      // Busca a capa da música mais recente
      const coverUri = await fetchAndCacheCover(albumId, mostRecentSong.uri);

      return coverUri || currentCoverUri;
    } catch (error) {
      console.error(`Error updating album cover for ${albumId}:`, error);
      return currentCoverUri;
    }
  }

  //  CARREGAMENTO DE ÁLBUNS ATUALIZADO
  const loadAlbums = useCallback(
    async (force = false) => {
      abortRef.current = false;

      try {
        const cached = await readAlbumsMeta();
        const cacheValid = cached && !isCacheExpired(cached.ts) && !force;

        if (cacheValid && cached.data.length > 0) {
          const fromCache: AlbumWithDetails[] = cached.data.map((a) => ({
            ...a,
            coverArt: undefined,
            songs: [],
          }));

          if (isMounted.current) {
            setAlbums(fromCache);
            setLoading(false);
            setLoadingCovers(true);
          }

          fromCache.forEach((a) => normalQueue.add(a.id));
          processCoverQueue();
          return;
        }

        const allAlbums = await MediaLibrary.getAlbumsAsync();
        const result: AlbumWithDetails[] = [];
        const BATCH = 10;

        for (let i = 0; i < allAlbums.length; i += BATCH) {
          if (abortRef.current) break;

          const batch = allAlbums.slice(i, i + BATCH);
          const settled = await Promise.allSettled(
            batch.map(async (album) => {
              // Busca TODAS as músicas para contar corretamente
              const allAssets = await MediaLibrary.getAssetsAsync({
                album: album.id,
                mediaType: ["audio"],
                first: 10000, // Busca um número grande para contar
              });

              if (allAssets.totalCount === 0) return null;

              return {
                id: album.id,
                title: album.title || "Álbum sem título",
                assetCount: allAssets.totalCount,
                coverArt: undefined,
                songs: [],
              } as AlbumWithDetails;
            }),
          );

          settled.forEach((r) => {
            if (r.status === "fulfilled" && r.value) {
              result.push(r.value);
              normalQueue.add(r.value.id);
            }
          });

          if (isMounted.current) setAlbums([...result]);

          if (i === 0) {
            setLoading(false);
            setLoadingCovers(true);
            processCoverQueue();
          }

          await new Promise((r) => setTimeout(r, 16));
        }

        await persistAlbumsMeta(result);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [processCoverQueue],
  );

  //  FUNÇÃO PARA FORCAR ATUALIZAÇÃO DE UM ÁLBUM ESPECÍFICO
  const refreshAlbumCover = useCallback(async (albumId: string) => {
    try {
      const newCover = await updateAlbumCover(albumId);
      if (newCover && isMounted.current) {
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === albumId ? { ...a, coverArt: newCover } : a,
          ),
        );
      }
      return newCover;
    } catch (error) {
      console.error(`Error refreshing cover for album ${albumId}:`, error);
      return undefined;
    }
  }, []);

  //  FUNÇÃO PARA ATUALIZAR TODAS AS CAPAS (quando o usuário adiciona novas músicas)
  const refreshAllAlbumCovers = useCallback(async () => {
    if (!isMounted.current) return;

    setLoadingCovers(true);

    // Limpa cache de capas para forçar recarregamento
    for (const album of albums) {
      await refreshAlbumCover(album.id);
    }

    setLoadingCovers(false);
  }, [albums, refreshAlbumCover]);

  useEffect(() => {
    isMounted.current = true;
    abortRef.current = false;
    return () => {
      isMounted.current = false;
      abortRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (permissionResponse?.granted) loadAlbums();
  }, [permissionResponse?.granted, loadAlbums]);

  const selectAlbum = (album: AlbumWithDetails) => {
    memoryAlbums.set(album.id, album);
  };

  const resetAlbumCoverMap = () => albumCoverSongMap.clear();

  const refreshAlbums = useCallback(async () => {
    await clearAlbumsCache();
    await loadAlbums(true);
  }, [loadAlbums]);

  return {
    albums,
    loading,
    selectAlbum,
    loadingCovers,
    permissionResponse,
    requestPermission,
    refreshAlbums,
    onAlbumsVisible,
    refreshAlbumCover,
    resetAlbumCoverMap,
    refreshAllAlbumCovers,
  };
};
