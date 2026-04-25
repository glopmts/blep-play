import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { albumsStoreSync } from "../database/cache/albumsStore";
import { GroupedAlbum, SongWithArt } from "../types/interfaces";
import { fetchAndCacheCover, getCoverUri } from "../utils/coverArtCache";
import { extractMusicMetadata, generateAlbumId } from "../utils/musicMetadata";

const priorityQueue = new Set<string>();
const normalQueue = new Set<string>();
const COVER_BATCH_SIZE = 5; // Processar 5 por vez
const COVER_BATCH_DELAY = 100; // Delay entre batches

export const useAlbumsGrouped = () => {
  const [albums, setAlbums] = useState<GroupedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(false);

  const isMounted = useRef(true);
  const abortRef = useRef(false);
  const processingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // ← CHAVE: ref sempre atualizada com o estado mais recente
  const albumsRef = useRef<GroupedAlbum[]>([]);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    isMounted.current = true;
    abortRef.current = false;
    return () => {
      isMounted.current = false;
      abortRef.current = true;
    };
  }, []);

  // Mantém albumsRef sincronizado com o estado
  const setAlbumsSync = useCallback(
    (updater: GroupedAlbum[] | ((prev: GroupedAlbum[]) => GroupedAlbum[])) => {
      setAlbums((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        albumsRef.current = next; // ← sempre atualizado
        return next;
      });
    },
    [],
  );

  const processCoverQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const processBatch = async (ids: string[]) => {
      // Processar multiplos em paralelo
      await Promise.all(
        ids.map(async (albumId) => {
          if (abortRef.current) return;

          const existing = await getCoverUri(albumId);
          if (existing) {
            if (isMounted.current) {
              setAlbumsSync((prev) =>
                prev.map((a) =>
                  a.id === albumId && !a.coverArt
                    ? { ...a, coverArt: existing }
                    : a,
                ),
              );
            }
            return;
          }

          const current =
            albumsRef.current.find((a) => a.id === albumId) ??
            albumsStoreSync.load().find((a) => a.id === albumId);

          const songUri = current?.songs?.[0]?.uri;
          if (!songUri) return;

          const coverUri = await fetchAndCacheCover(albumId, songUri);
          if (isMounted.current && coverUri) {
            setAlbumsSync((prev) =>
              prev.map((a) =>
                a.id === albumId ? { ...a, coverArt: coverUri } : a,
              ),
            );
          }
        }),
      );
    };

    while (priorityQueue.size > 0 || normalQueue.size > 0) {
      if (abortRef.current) break;

      const batch: string[] = [];

      // Prioridade primeiro
      while (priorityQueue.size > 0 && batch.length < COVER_BATCH_SIZE) {
        const [id] = priorityQueue;
        priorityQueue.delete(id);
        batch.push(id);
      }

      // Depois normal
      while (normalQueue.size > 0 && batch.length < COVER_BATCH_SIZE) {
        const [id] = normalQueue;
        normalQueue.delete(id);
        batch.push(id);
      }

      if (batch.length > 0) {
        await processBatch(batch);
        await new Promise((r) => setTimeout(r, COVER_BATCH_DELAY));
      }
    }

    processingRef.current = false;
    if (isMounted.current) setLoadingCovers(false);
  }, []);

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
      const savedHash = albumsStoreSync.loadModificationHash();
      if (String(latest) !== savedHash) {
        albumsStoreSync.saveModificationHash(String(latest));
        return true;
      }
      return false;
    } catch {
      return true;
    }
  };

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
        coverArt: undefined,
        songs,
      });
    }

    return grouped.sort((a, b) => a.artistName.localeCompare(b.artistName));
  };

  const initAlbums = useCallback(async () => {
    if (isInitializedRef.current && albumsRef.current.length > 0) return;

    setLoading(true);
    priorityQueue.clear();
    normalQueue.clear();

    try {
      const stored = albumsStoreSync.load();
      if (stored.length > 0) {
        const withoutArt = stored.map((a) => ({
          ...a,
          coverArt: undefined,
          songs: a.songs.map((s) => ({ ...s, coverArt: undefined })),
        })) as GroupedAlbum[];

        albumsStoreSync.setMemory(withoutArt);

        if (isMounted.current) {
          setAlbumsSync(withoutArt); // ← usa setAlbumsSync
          setLoading(false);
          setLoadingCovers(true);
          isInitializedRef.current = true;
        }

        withoutArt.forEach((a) => normalQueue.add(a.id));
        processCoverQueue();

        const hasChanges = await checkForChanges();
        if (!hasChanges) return;

        const fresh = await buildGroupedAlbums();
        albumsStoreSync.save(fresh);
        albumsStoreSync.setMemory(fresh);

        if (isMounted.current) {
          setAlbumsSync((prev) =>
            fresh.map((a) => ({
              ...a,
              coverArt: prev.find((p) => p.id === a.id)?.coverArt,
            })),
          );
        }

        fresh.forEach((a) => {
          if (!stored.find((s) => s.id === a.id)) normalQueue.add(a.id);
        });
        if (!processingRef.current) processCoverQueue();
        return;
      }

      const fresh = await buildGroupedAlbums();
      albumsStoreSync.save(fresh);
      albumsStoreSync.setMemory(fresh);

      if (isMounted.current) {
        setAlbumsSync(fresh); // ← usa setAlbumsSync
        setLoading(false);
        setLoadingCovers(true);
        isInitializedRef.current = true;
      }

      fresh.forEach((a) => normalQueue.add(a.id));
      processCoverQueue();
    } catch (err) {
      console.error("Erro ao inicializar álbuns:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [processCoverQueue, setAlbumsSync]);

  useEffect(() => {
    if (permissionResponse?.granted && !isInitializedRef.current) {
      initAlbums();
    }
  }, [permissionResponse?.granted]);

  const refreshAlbums = useCallback(async () => {
    albumsStoreSync.clear();
    isInitializedRef.current = false;
    albumsRef.current = [];
    priorityQueue.clear();
    normalQueue.clear();
    await initAlbums();
  }, [initAlbums]);

  return {
    albums,
    loading,
    loadingCovers,
    permissionResponse,
    requestPermission,
    refreshAlbums,
    onAlbumsVisible,
  };
};
