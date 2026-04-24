import { CachedSongMetadata } from "@/types/song-interfaces";
import {
  bulkCacheMetadata,
  getAllCachedMetadata,
} from "@/utils/song-metadata/metadataCache";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import { useAlbumsContext } from "../context/albums-context";
import { AlbumWithDetails, SongWithArt } from "../types/interfaces";
import { fetchAndCacheCover } from "../utils/coverArtCache";
import { getSongMetadata } from "../utils/getSongMetadata";

const SONGS_PER_PAGE = 20;
const COVERS_BATCH_SIZE = 10;

interface AlbumParams {
  albumId?: string;
  type?: "album_local" | "album_artist";
}

const albumCache = new Map<
  string,
  { data: AlbumWithDetails; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000;

type CoverMap = Map<string, string>;

export const useAlbumDetails = ({
  albumId,
  type = "album_local",
}: AlbumParams) => {
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [albumDetails, setAlbumDetails] = useState<AlbumWithDetails | null>(
    null,
  );

  const allSongsRef = useRef<SongWithArt[]>([]);
  const coverMapRef = useRef<CoverMap>(new Map());

  const [displayedSongs, setDisplayedSongs] = useState<SongWithArt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { albums, groupedAlbums, loadingAlbums, loadingGrouped } =
    useAlbumsContext();

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const mergeCover = useCallback(
    (song: SongWithArt): SongWithArt => ({
      ...song,
      coverArt: coverMapRef.current.get(song.id) ?? song.coverArt,
    }),
    [],
  );

  const flushCoversToDisplayed = useCallback(() => {
    if (!isMounted.current) return;
    setDisplayedSongs((prev) => prev.map(mergeCover));
    setAlbumDetails((prev) =>
      prev
        ? {
            ...prev,
            coverArt:
              coverMapRef.current.values().next().value ?? prev.coverArt,
            songs: prev.songs.map(mergeCover),
          }
        : prev,
    );
  }, [mergeCover]);

  const loadCoversForSongs = useCallback(
    async (songs: SongWithArt[]) => {
      if (!isMounted.current || songs.length === 0) return;

      for (let i = 0; i < songs.length; i += COVERS_BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) return;

        const batch = songs.slice(i, i + COVERS_BATCH_SIZE);

        await Promise.all(
          batch.map(async (song) => {
            if (coverMapRef.current.has(song.id)) return;
            const uri = await fetchAndCacheCover(song.id, song.uri);
            if (uri) coverMapRef.current.set(song.id, uri);
          }),
        );

        flushCoversToDisplayed();
      }
    },
    [flushCoversToDisplayed],
  );

  const loadMoreSongs = useCallback(async () => {
    if (loadingMore || !hasMore || !albumId) return;

    setLoadingMore(true);

    const nextPage = currentPage + 1;
    const startIndex = currentPage * SONGS_PER_PAGE;
    const endIndex = startIndex + SONGS_PER_PAGE;
    const newSongs = allSongsRef.current.slice(startIndex, endIndex);

    if (newSongs.length > 0) {
      const newSongsWithCovers = newSongs.map(mergeCover);

      setDisplayedSongs((prev) => [...prev, ...newSongsWithCovers]);
      setAlbumDetails((prev) =>
        prev
          ? { ...prev, songs: [...prev.songs, ...newSongsWithCovers] }
          : prev,
      );
      setCurrentPage(nextPage);
      setHasMore(endIndex < allSongsRef.current.length);

      loadCoversForSongs(newSongs);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [
    loadingMore,
    hasMore,
    currentPage,
    albumId,
    mergeCover,
    loadCoversForSongs,
  ]);

  const fetchAlbumArtist = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        allSongsRef.current = cached.data.songs;
        cached.data.songs.forEach((s) => {
          if (s.coverArt) coverMapRef.current.set(s.id, s.coverArt);
        });
        const initialSongs = cached.data.songs
          .slice(0, SONGS_PER_PAGE)
          .map(mergeCover);
        setDisplayedSongs(initialSongs);
        setHasMore(cached.data.songs.length > SONGS_PER_PAGE);
        setCurrentPage(1);
        setAlbumDetails({ ...cached.data, songs: initialSongs });
        setLoadingDetails(false);
      }
      return;
    }

    isLoadingRef.current = true;
    setLoadingDetails(true);

    try {
      const album = groupedAlbums.find((a) => a.id === albumId);
      if (!album) {
        console.warn(
          `[useAlbumDetails] album_artist: id "${albumId}" não encontrado`,
        );
        return;
      }

      const songsWithoutArt: SongWithArt[] = album.songs.map((s) => ({
        ...s,
        coverArt: undefined as string | undefined,
      }));

      allSongsRef.current = songsWithoutArt;
      const initialSongs = songsWithoutArt.slice(0, SONGS_PER_PAGE);

      if (isMounted.current) {
        setDisplayedSongs(initialSongs);
        setHasMore(songsWithoutArt.length > SONGS_PER_PAGE);
        setCurrentPage(1);
        setAlbumDetails({ ...album, coverArt: undefined, songs: initialSongs });
        setLoadingDetails(false);
      }

      await loadCoversForSongs(allSongsRef.current);

      if (isMounted.current) {
        const firstCover = coverMapRef.current.values().next().value;
        albumCache.set(albumId, {
          data: {
            ...album,
            coverArt: firstCover,
            songs: allSongsRef.current.map((s) => ({
              ...s,
              coverArt: coverMapRef.current.get(s.id),
            })),
          },
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("[useAlbumDetails] fetchAlbumArtist:", err);
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
        isLoadingRef.current = false;
      }
    }
  }, [albumId, groupedAlbums, loadCoversForSongs, mergeCover]);

  const fetchAlbumLocal = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        allSongsRef.current = cached.data.songs;
        cached.data.songs.forEach((s) => {
          if (s.coverArt) coverMapRef.current.set(s.id, s.coverArt);
        });
        const initialSongs = cached.data.songs
          .slice(0, SONGS_PER_PAGE)
          .map(mergeCover);
        setDisplayedSongs(initialSongs);
        setHasMore(cached.data.songs.length > SONGS_PER_PAGE);
        setCurrentPage(1);
        setAlbumDetails({ ...cached.data, songs: initialSongs });
        setLoadingDetails(false);
      }
      return;
    }

    isLoadingRef.current = true;
    setLoadingDetails(true);

    try {
      const albumMeta = albums.find((a) => a.id === albumId);
      if (!albumMeta) {
        console.warn(`[fetchAlbumLocal] id "${albumId}" não encontrado`);
        return;
      }

      // Usa assetCount já disponível no meta — elimina o double-fetch
      const totalCount = albumMeta.assetCount ?? 0;
      if (totalCount === 0) {
        console.warn("[fetchAlbumLocal] Nenhuma música encontrada");
        return;
      }

      const allAssets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: totalCount,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      // Lê o cache de metadados uma única vez antes de qualquer loop
      const metaCache = await getAllCachedMetadata();

      // Separa músicas com cache de músicas que precisam de I/O
      const fromCache: SongWithArt[] = [];
      const needsInfo: MediaLibrary.Asset[] = [];

      for (const asset of allAssets.assets) {
        const hit = metaCache[asset.uri] as CachedSongMetadata | undefined;
        if (hit) {
          fromCache.push({
            ...asset,
            title: hit.title ?? asset.filename,
            artist: hit.artist ?? "Desconhecido",
            album: hit.album ?? "Desconhecido",
            albumName: hit.album ?? "Desconhecido",
            genre: hit.genre ?? "Desconhecido",
            year: hit.year ?? "Desconhecido",
            track: hit.track ?? "0",
            duration: asset.duration,
            coverArt: undefined,
          });
        } else {
          needsInfo.push(asset);
        }
      }

      const allSongsWithMeta: SongWithArt[] = [...fromCache];

      // Exibe imediatamente o que veio do cache
      if (fromCache.length > 0 && isMounted.current) {
        allSongsRef.current = allSongsWithMeta;
        const initialSongs = allSongsWithMeta.slice(0, SONGS_PER_PAGE);
        setDisplayedSongs(initialSongs);
        setHasMore(allSongsWithMeta.length > SONGS_PER_PAGE);
        setAlbumDetails({
          id: albumId,
          title: albumMeta.title,
          assetCount: totalCount,
          coverArt: albumMeta.coverArt,
          songs: initialSongs,
        });
        setLoadingDetails(false);
      }

      // Acumula metadados novos para gravar em uma única escrita no final
      const batchMetaToCache: Record<string, any> = {};

      // Busca getAssetInfoAsync + getSongMetadata só para músicas sem cache
      // Batch maior (12) porque o gargalo é I/O nativo, não CPU
      const FRESH_BATCH = 12;
      for (let i = 0; i < needsInfo.length; i += FRESH_BATCH) {
        if (abortControllerRef.current?.signal.aborted) break;

        const batch = needsInfo.slice(i, i + FRESH_BATCH);

        const batchResults = await Promise.allSettled(
          batch.map(async (asset) => {
            try {
              const info = await MediaLibrary.getAssetInfoAsync(asset.id);
              const metadata = await getSongMetadata(info.uri);
              batchMetaToCache[info.uri] = metadata;
              return {
                ...asset,
                title: metadata.title ?? asset.filename,
                artist: metadata.artist ?? "Desconhecido",
                album: metadata.album ?? "Desconhecido",
                albumName: metadata.album ?? "Desconhecido",
                genre: metadata.genre ?? "Desconhecido",
                year: metadata.year ?? "Desconhecido",
                track: metadata.track ?? "0",
                duration: info.duration ?? asset.duration,
                coverArt: undefined as string | undefined,
              } as SongWithArt;
            } catch (err) {
              console.error("[fetchAlbumLocal] getAssetInfoAsync:", err);
              return {
                ...asset,
                artist: "Desconhecido",
                album: "Desconhecido",
                albumName: "Desconhecido",
                genre: "Desconhecido",
                year: "Desconhecido",
                track: "0",
                title: asset.filename,
                duration: asset.duration,
                coverArt: undefined as string | undefined,
              } as SongWithArt;
            }
          }),
        );

        batchResults.forEach((r) => {
          if (r.status === "fulfilled") allSongsWithMeta.push(r.value);
        });

        // Atualiza UI após cada batch de músicas novas
        if (isMounted.current) {
          allSongsRef.current = allSongsWithMeta;
          const displayed = allSongsWithMeta.slice(0, SONGS_PER_PAGE);
          setDisplayedSongs(displayed);
          setHasMore(allSongsWithMeta.length > displayed.length);

          if (loadingDetails) {
            setAlbumDetails({
              id: albumId,
              title: albumMeta.title,
              assetCount: totalCount,
              coverArt: albumMeta.coverArt,
              songs: displayed,
            });
            setLoadingDetails(false);
          }
        }
      }

      allSongsRef.current = allSongsWithMeta;
      const initialSongs = allSongsWithMeta.slice(0, SONGS_PER_PAGE);

      if (isMounted.current) {
        setDisplayedSongs(initialSongs);
        setHasMore(allSongsWithMeta.length > SONGS_PER_PAGE);
        setCurrentPage(1);
        setAlbumDetails({
          id: albumId,
          title: albumMeta.title,
          assetCount: allSongsWithMeta.length,
          coverArt: albumMeta.coverArt,
          songs: initialSongs,
        });
        setLoadingDetails(false);
      }

      // Persiste todos os metadados novos em uma única escrita
      if (Object.keys(batchMetaToCache).length > 0) {
        bulkCacheMetadata(batchMetaToCache).catch((err) =>
          console.error("[fetchAlbumLocal] bulkCacheMetadata:", err),
        );
      }

      // Capas em background: prioriza músicas visíveis, resto em seguida
      setLoadingCovers(true);
      await loadCoversForSongs(initialSongs);
      const remaining = allSongsWithMeta.slice(SONGS_PER_PAGE);
      loadCoversForSongs(remaining).finally(() => {
        if (isMounted.current) {
          setLoadingCovers(false);
          const firstCover = coverMapRef.current.values().next().value;
          albumCache.set(albumId, {
            data: {
              id: albumId,
              title: albumMeta.title,
              assetCount: allSongsWithMeta.length,
              coverArt: firstCover ?? albumMeta.coverArt,
              songs: allSongsRef.current.map((s) => ({
                ...s,
                coverArt: coverMapRef.current.get(s.id),
              })),
            },
            timestamp: Date.now(),
          });
        }
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[fetchAlbumLocal]", err);
        if (isMounted.current)
          Alert.alert("Erro", "Não foi possível carregar o álbum");
      }
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
        isLoadingRef.current = false;
      }
    }
  }, [albumId, albums, loadCoversForSongs, mergeCover]);

  const fetchAlbum = useCallback(() => {
    if (type === "album_artist") return fetchAlbumArtist();
    return fetchAlbumLocal();
  }, [type, fetchAlbumArtist, fetchAlbumLocal]);

  const contextReady =
    type === "album_artist" ? !loadingGrouped : !loadingAlbums;

  useEffect(() => {
    if (!contextReady) return;

    isMounted.current = true;
    isLoadingRef.current = false;
    allSongsRef.current = [];
    coverMapRef.current = new Map();

    const timer = setTimeout(fetchAlbum, 50);

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active" && albumId && !isLoadingRef.current) {
          const cached = albumCache.get(albumId);
          if (!cached || Date.now() - cached.timestamp > CACHE_TTL)
            fetchAlbum();
        }
      },
    );

    return () => {
      clearTimeout(timer);
      subscription.remove();
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, [albumId, fetchAlbum, contextReady]);

  const refreshAlbum = useCallback(() => {
    if (!albumId) return;
    albumCache.delete(albumId);
    allSongsRef.current = [];
    coverMapRef.current = new Map();
    setDisplayedSongs([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchAlbum();
  }, [albumId, fetchAlbum]);

  return {
    albumDetails,
    loadingDetails: loadingDetails || !contextReady,
    loadingCovers,
    loadingMore,
    hasMore,
    loadMoreSongs,
    totalSongsCount: allSongsRef.current.length,
    refreshAlbum,
  };
};
