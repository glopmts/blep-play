import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlbumWithDetails } from "../types/interfaces";
import { fetchAndCacheCover, getCoverUri } from "../utils/coverArtCache";

const CACHE_KEY_ALBUMS = "albums_meta_v2"; // v2 — formato novo
const CACHE_TTL = 30 * 60 * 1000; // 30 min (metadados mudam pouco)

// Cache em memória só de metadados (sem imagens)
const memoryAlbums = new Map<string, AlbumWithDetails>();

async function readAlbumsMeta(): Promise<{
  data: Omit<AlbumWithDetails, "coverArt" | "songs">[];
  ts: number;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_ALBUMS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function persistAlbumsMeta(albums: AlbumWithDetails[]): Promise<void> {
  try {
    const light = albums.map(({ coverArt: _, songs: __, ...rest }) => rest);
    await AsyncStorage.setItem(
      CACHE_KEY_ALBUMS,
      JSON.stringify({ data: light, ts: Date.now() }),
    );
  } catch {}
}

const priorityQueue = new Set<string>(); // albumIds visíveis
const normalQueue = new Set<string>(); // álbumes não visíveis

export const useAlbum = () => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const isMounted = useRef(true);
  const abortRef = useRef(false);
  const processingRef = useRef(false);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // Chamado pela FlatList quando itens entram/saem da tela
  const onAlbumsVisible = useCallback((visibleIds: string[]) => {
    visibleIds.forEach((id) => {
      priorityQueue.add(id);
      normalQueue.delete(id); // tira da fila normal se estava lá
    });
    // Inicia processamento se não está rodando
    if (!processingRef.current) processCoverQueue();
  }, []);

  const processCoverQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    // Drena prioritários primeiro, depois normais
    const drainQueue = async (queue: Set<string>) => {
      for (const albumId of [...queue]) {
        if (abortRef.current) break;
        queue.delete(albumId);

        // Já tem capa? Pula
        const existing = await getCoverUri(albumId);
        if (existing) {
          if (isMounted.current) {
            setAlbums((prev) =>
              prev.map((a) =>
                a.id === albumId && !a.coverArt
                  ? { ...a, coverArt: existing }
                  : a,
              ),
            );
          }
          continue;
        }

        // Busca a URI da primeira música
        const assets = await MediaLibrary.getAssetsAsync({
          album: albumId,
          mediaType: ["audio"],
          first: 1,
        });
        const songUri = assets.assets[0]?.uri;
        if (!songUri) continue;

        const coverUri = await fetchAndCacheCover(albumId, songUri);
        if (isMounted.current && coverUri) {
          setAlbums((prev) =>
            prev.map((a) =>
              a.id === albumId ? { ...a, coverArt: coverUri } : a,
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

  const loadAlbums = useCallback(async (force = false) => {
    abortRef.current = false;
    setLoading(true);

    try {
      // ── Mostra metadados do cache imediatamente ──
      const cached = await readAlbumsMeta();
      const cacheValid = cached && Date.now() - cached.ts < CACHE_TTL && !force;

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

        // Enfileira todos para background — visíveis serão priorizados via onAlbumsVisible
        fromCache.forEach((a) => normalQueue.add(a.id));
        processCoverQueue();
        return;
      }

      // ── Primeiro acesso: busca metadados em lotes ──
      const allAlbums = await MediaLibrary.getAlbumsAsync();
      const result: AlbumWithDetails[] = [];
      const BATCH = 10;

      for (let i = 0; i < allAlbums.length; i += BATCH) {
        if (abortRef.current) break;

        const batch = allAlbums.slice(i, i + BATCH);
        const settled = await Promise.allSettled(
          batch.map(async (album) => {
            const first = await MediaLibrary.getAssetsAsync({
              album: album.id,
              mediaType: ["audio"],
              first: 1,
            });
            if (first.totalCount === 0) return null;
            return {
              id: album.id,
              title: album.title || "Álbum sem título",
              assetCount: first.totalCount,
              coverArt: undefined,
              songs: [],
            } as AlbumWithDetails;
          }),
        );

        settled.forEach((r) => {
          if (r.status === "fulfilled" && r.value) {
            result.push(r.value);
            normalQueue.add(r.value.id); // enfileira para capa
          }
        });

        if (isMounted.current) setAlbums([...result]);

        // Primeiro lote — inicia processamento de capas já
        if (i === 0) {
          setLoading(false);
          setLoadingCovers(true);
          processCoverQueue();
        }

        await new Promise((r) => setTimeout(r, 16));
      }

      persistAlbumsMeta(result);
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

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
  }, [permissionResponse?.granted]);

  const selectAlbum = (album: AlbumWithDetails) => {
    memoryAlbums.set(album.id, album);
  };

  return {
    albums,
    loading,
    selectAlbum,
    loadingCovers,
    permissionResponse,
    requestPermission,
    refreshAlbums: () => loadAlbums(true),
    onAlbumsVisible, // ← expõe para a FlatList
  };
};
