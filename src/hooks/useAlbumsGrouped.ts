import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { albumsStore } from "../store/albumsStore";
import { GroupedAlbum, SongWithArt } from "../types/interfaces";
import { fetchAndCacheCover, getCoverUri } from "../utils/coverArtCache";
import { extractMusicMetadata, generateAlbumId } from "../utils/musicMetadata";

const ASSETS_CACHE_KEY = "assets_modification_hash";

// Filas de prioridade — fora do hook para persistir entre renders
const priorityQueue = new Set<string>();
const normalQueue = new Set<string>();

export const useAlbumsGrouped = () => {
  const [albums, setAlbums] = useState<GroupedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const isMounted = useRef(true);
  const abortRef = useRef(false);
  const processingRef = useRef(false);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    isMounted.current = true;
    abortRef.current = false;
    return () => {
      isMounted.current = false;
      abortRef.current = true;
    };
  }, []);

  // ── Drena as filas processando capa por capa ──
  const processCoverQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const processAlbum = async (albumId: string) => {
      if (abortRef.current) return;

      // Já tem no disco — aplica direto sem extrair nada
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
        return;
      }

      // Busca URI da primeira música do álbum
      const current =
        albums.find((a) => a.id === albumId) ??
        (await albumsStore.load()).find((a) => a.id === albumId);
      const songUri = current?.songs?.[0]?.uri;
      if (!songUri) return;

      const coverUri = await fetchAndCacheCover(albumId, songUri);
      if (isMounted.current && coverUri) {
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === albumId ? { ...a, coverArt: coverUri } : a,
          ),
        );
      }

      await new Promise((r) => setTimeout(r, 30));
    };

    // Esvazia prioritários primeiro, depois normais
    while (priorityQueue.size > 0 || normalQueue.size > 0) {
      if (abortRef.current) break;

      if (priorityQueue.size > 0) {
        const [id] = priorityQueue;
        priorityQueue.delete(id);
        await processAlbum(id);
      } else {
        const [id] = normalQueue;
        normalQueue.delete(id);
        await processAlbum(id);
      }
    }

    processingRef.current = false;
    if (isMounted.current) setLoadingCovers(false);
  }, [albums]);

  // Chamado pela FlatList via onViewableItemsChanged
  const onAlbumsVisible = useCallback(
    (visibleIds: string[]) => {
      visibleIds.forEach((id) => {
        priorityQueue.add(id);
        normalQueue.delete(id);
      });
      if (!processingRef.current) processCoverQueue();
    },
    [processCoverQueue],
  );

  const checkForChanges = async (): Promise<boolean> => {
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: ["audio"],
        first: 1,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });
      const latest = assets.assets[0]?.modificationTime ?? 0;
      const saved = await AsyncStorage.getItem(ASSETS_CACHE_KEY);
      if (String(latest) !== saved) {
        await AsyncStorage.setItem(ASSETS_CACHE_KEY, String(latest));
        return true;
      }
      return false;
    } catch {
      return true;
    }
  };

  // ── Agrupa assets por artista sem buscar capas ──
  const buildGroupedAlbums = async (): Promise<GroupedAlbum[]> => {
    const allAssets = await MediaLibrary.getAssetsAsync({
      mediaType: ["audio"],
      first: 10000,
      sortBy: [MediaLibrary.SortBy.modificationTime],
    });

    const albumMap = new Map<string, SongWithArt[]>();

    for (const asset of allAssets.assets) {
      const metadata = extractMusicMetadata(asset.filename);
      const albumKey = generateAlbumId(metadata.artist);
      const song: SongWithArt = {
        ...asset,
        title: metadata.title,
        artist: metadata.artist,
        albumName: metadata.albumName,
      };
      if (!albumMap.has(albumKey)) albumMap.set(albumKey, []);
      albumMap.get(albumKey)!.push(song);
    }

    const grouped: GroupedAlbum[] = [];
    for (const [albumKey, songs] of albumMap.entries()) {
      const metadata = extractMusicMetadata(songs[0].filename);
      grouped.push({
        id: albumKey,
        title: metadata.artist,
        artistName: metadata.artist,
        albumName: metadata.albumName,
        assetCount: songs.length,
        coverArt: undefined, // sem capa por enquanto
        songs,
      });
    }

    return grouped.sort((a, b) => a.artistName.localeCompare(b.artistName));
  };

  const initAlbums = useCallback(async () => {
    setLoading(true);
    priorityQueue.clear();
    normalQueue.clear();

    try {
      // ── FASE 1: Cache → UI instantânea ──
      const stored = await albumsStore.load();
      if (stored.length > 0) {
        const withoutArt = stored.map((a) => ({
          ...a,
          coverArt: undefined,
          songs: a.songs.map((s) => ({ ...s, coverArt: undefined })),
        })) as GroupedAlbum[];

        albumsStore.setMemory(withoutArt);
        if (isMounted.current) {
          setAlbums(withoutArt);
          setLoading(false);
          setLoadingCovers(true);
        }

        // Enfileira todos — visíveis serão priorizados pela FlatList
        withoutArt.forEach((a) => normalQueue.add(a.id));
        processCoverQueue();

        // ── FASE 2: Verifica mudanças em background ──
        const hasChanges = await checkForChanges();
        if (!hasChanges) return; // cache válido, apenas capas em background

        // Mudou algo — reprocessa metadados sem bloquear UI
        const fresh = await buildGroupedAlbums();
        await albumsStore.save(fresh);
        albumsStore.setMemory(fresh);

        // Preserva capas já carregadas
        if (isMounted.current) {
          setAlbums((prev) =>
            fresh.map((a) => ({
              ...a,
              coverArt: prev.find((p) => p.id === a.id)?.coverArt,
            })),
          );
        }

        // Enfileira novos álbuns que podem ter aparecido
        fresh.forEach((a) => {
          if (!stored.find((s) => s.id === a.id)) normalQueue.add(a.id);
        });
        if (!processingRef.current) processCoverQueue();
        return;
      }

      // ── Primeiro acesso: sem cache ──
      const fresh = await buildGroupedAlbums();
      await albumsStore.save(fresh);
      albumsStore.setMemory(fresh);

      if (isMounted.current) {
        setAlbums(fresh);
        setLoading(false);
        setLoadingCovers(true);
      }

      fresh.forEach((a) => normalQueue.add(a.id));
      processCoverQueue();
    } catch (err) {
      console.error("Erro ao inicializar álbuns:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [processCoverQueue]);

  useEffect(() => {
    if (permissionResponse?.granted) initAlbums();
  }, [permissionResponse?.granted]);

  return {
    albums,
    loading,
    loadingCovers,
    permissionResponse,
    requestPermission,
    refreshAlbums: initAlbums,
    onAlbumsVisible, // ← conecta na FlatList
  };
};
