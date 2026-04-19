import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { AlbumWithDetails } from "../types/interfaces";
import { getSongCoverArt } from "../utils/getSongCoverArt";

// ─── Cache persistente (AsyncStorage)
const CACHE_KEY_ALBUMS = "albums_list_v1";
const CACHE_KEY_COVERS = "covers_map_v1";
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Cache em memória (evita I/O repetido no AsyncStorage)
const memoryAlbums = new Map<string, AlbumWithDetails>();
const memoryCovers = new Map<string, string>(); // albumId → coverArt URI/base64
let albumsCachedAt = 0;

async function readCoverCache(): Promise<void> {
  if (memoryCovers.size > 0) return; // já carregado
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_COVERS);
    if (raw) {
      const obj: Record<string, string> = JSON.parse(raw);
      Object.entries(obj).forEach(([k, v]) => memoryCovers.set(k, v));
    }
  } catch {}
}

async function persistCoverCache(): Promise<void> {
  try {
    const obj = Object.fromEntries(memoryCovers);
    await AsyncStorage.setItem(CACHE_KEY_COVERS, JSON.stringify(obj));
  } catch {}
}

async function readAlbumsCache(): Promise<{
  data: AlbumWithDetails[];
  ts: number;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_ALBUMS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function persistAlbumsCache(albums: AlbumWithDetails[]): Promise<void> {
  try {
    // Não persiste coverArt (pesada) — só metadados
    const light = albums.map(({ coverArt: _drop, songs: _s, ...rest }) => rest);
    await AsyncStorage.setItem(
      CACHE_KEY_ALBUMS,
      JSON.stringify({ data: light, ts: Date.now() }),
    );
  } catch {}
}

// ─── Busca capa de 1 álbum com cache ─
async function fetchCoverArt(albumId: string): Promise<string | undefined> {
  if (memoryCovers.has(albumId)) return memoryCovers.get(albumId);

  try {
    const assets = await MediaLibrary.getAssetsAsync({
      album: albumId,
      mediaType: ["audio"],
      first: 1,
      sortBy: [MediaLibrary.SortBy.modificationTime],
    });

    const song = assets.assets[0];
    if (!song) return undefined;

    const cover = await getSongCoverArt(song.uri);
    if (cover) {
      memoryCovers.set(albumId, cover);
      // Persiste em background
      persistCoverCache();
    }
    return cover ?? undefined;
  } catch {
    return undefined;
  }
}

// ─── Carrega só metadados (sem músicas completas)
async function fetchAlbumMeta(
  album: MediaLibrary.Album,
): Promise<AlbumWithDetails | null> {
  // Só 1 asset pra saber se tem áudio
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
    coverArt: memoryCovers.get(album.id), // pode ser undefined ainda
    songs: [], // músicas carregadas só quando abrir o álbum
  };
}

// ─── Hook
export const useAlbum = () => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithDetails | null>(
    null,
  );
  const [coverProgress, setCoverProgress] = useState(0); // 0-100
  const [loadingCovers, setLoadingCovers] = useState(false);
  const isMounted = useRef(true);
  const abortRef = useRef(false);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Carregamento principal
  const loadAlbums = useCallback(async (force = false) => {
    setLoading(true);
    abortRef.current = false;

    // 1. Lê cache de capas do disco
    await readCoverCache();

    // 2. Tenta servir do cache de álbuns enquanto atualiza em background
    const cached = await readAlbumsCache();
    const cacheValid = cached && Date.now() - cached.ts < CACHE_TTL && !force;

    if (cacheValid && cached) {
      // Restaura memória e exibe imediatamente
      const restored = cached.data.map((a: AlbumWithDetails) => ({
        ...a,
        coverArt: memoryCovers.get(a.id),
        songs: [],
      }));
      restored.forEach((a: AlbumWithDetails) => memoryAlbums.set(a.id, a));
      if (isMounted.current) {
        setAlbums(restored);
        setLoading(false);
      }
      // Carrega capas faltantes em background sem bloquear UI
      loadMissingCovers(restored);
      return;
    }

    try {
      // 3. Busca lista de álbuns da MediaLibrary
      const allAlbums = await MediaLibrary.getAlbumsAsync();

      // 4. Processa em lotes de 5 (não trava a thread JS)
      const BATCH = 5;
      const result: AlbumWithDetails[] = [];

      for (let i = 0; i < allAlbums.length; i += BATCH) {
        if (abortRef.current) break;

        const batch = allAlbums.slice(i, i + BATCH);
        const settled = await Promise.allSettled(
          batch.map((a) => fetchAlbumMeta(a)),
        );

        settled.forEach((r) => {
          if (r.status === "fulfilled" && r.value) {
            result.push(r.value);
            memoryAlbums.set(r.value.id, r.value);
          }
        });

        // Atualiza UI a cada lote — usuário já vê resultados parciais
        if (isMounted.current) setAlbums([...result]);

        // Respira entre lotes (evita jank)
        await new Promise((r) => setTimeout(r, 16));
      }

      persistAlbumsCache(result);
      albumsCachedAt = Date.now();

      // 5. Carrega capas progressivamente em background
      loadMissingCovers(result);
    } catch (err) {
      console.error("Erro ao carregar álbuns:", err);
      Alert.alert("Erro", "Não foi possível carregar os álbuns");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // ── Capas em background, uma a uma──
  const loadMissingCovers = useCallback(
    async (albumList: AlbumWithDetails[]) => {
      const withoutCover = albumList.filter((a) => !memoryCovers.has(a.id));
      if (withoutCover.length === 0) return;
      setLoadingCovers(true);

      for (let i = 0; i < withoutCover.length; i++) {
        if (abortRef.current) break;
        const album = withoutCover[i];

        const cover = await fetchCoverArt(album.id);

        if (isMounted.current && cover) {
          // Atualiza só o álbum que recebeu a capa
          setAlbums((prev) =>
            prev.map((a) =>
              a.id === album.id ? { ...a, coverArt: cover } : a,
            ),
          );
          setCoverProgress(Math.round(((i + 1) / withoutCover.length) * 100));
        }

        // Pausa entre capas pra não sobrar CPU
        await new Promise((r) => setTimeout(r, 30));
      }

      setCoverProgress(100);
      setLoadingCovers(false);
    },
    [],
  );

  useEffect(() => {
    if (permissionResponse?.granted) loadAlbums();
  }, [permissionResponse?.granted]);

  const refresh = useCallback(() => loadAlbums(true), [loadAlbums]);

  const clearCache = useCallback(async () => {
    memoryAlbums.clear();
    memoryCovers.clear();
    albumsCachedAt = 0;
    await AsyncStorage.multiRemove([CACHE_KEY_ALBUMS, CACHE_KEY_COVERS]);
  }, []);

  const selectAlbum = async (album: AlbumWithDetails) => {
    setSelectedAlbum(album);
  };

  return {
    albums,
    loading,
    coverProgress,
    loadingCovers,
    permissionResponse,
    selectedAlbum,
    selectAlbum,
    requestPermission,
    refreshAlbums: refresh,
    clearCache,
  };
};
