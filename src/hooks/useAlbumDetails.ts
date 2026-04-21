import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import { useAlbumsContext } from "../context/AlbumsContext";
import { AlbumWithDetails, SongWithArt } from "../types/interfaces";
import { fetchAndCacheCover } from "../utils/coverArtCache";
import { getSongCoverArt } from "../utils/getSongCoverArt";

const SONGS_PER_PAGE = 20; // Quantas músicas carregar por página
const COVERS_BATCH_SIZE = 5; // Tamanho do lote para carregar capas

interface AlbumParams {
  albumId?: string;
  type?: "album_local" | "album_artist";
}

const albumCache = new Map<
  string,
  { data: AlbumWithDetails; timestamp: number }
>();
const coverArtCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

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

  // Estado para paginação
  const [allSongs, setAllSongs] = useState<SongWithArt[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<SongWithArt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { albums, groupedAlbums, loadingAlbums, loadingGrouped } =
    useAlbumsContext();

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const fetchSongCoverArt = useCallback(
    async (songUri: string): Promise<string | undefined> => {
      const cached = coverArtCache.get(songUri);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL)
        return cached.data;

      try {
        const coverArt = await getSongCoverArt(songUri);
        if (coverArt)
          coverArtCache.set(songUri, { data: coverArt, timestamp: Date.now() });
        return coverArt;
      } catch {
        return undefined;
      }
    },
    [],
  );

  // Função para carregar mais músicas (scroll infinito)
  const loadMoreSongs = useCallback(async () => {
    if (loadingMore || !hasMore || !albumId) return;

    setLoadingMore(true);

    const nextPage = currentPage + 1;
    const startIndex = currentPage * SONGS_PER_PAGE;
    const endIndex = startIndex + SONGS_PER_PAGE;
    const newSongs = allSongs.slice(startIndex, endIndex);

    if (newSongs.length > 0) {
      setDisplayedSongs((prev) => [...prev, ...newSongs]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < allSongs.length);

      // Atualiza o albumDetails com as novas músicas
      if (isMounted.current && albumDetails) {
        setAlbumDetails({
          ...albumDetails,
          songs: [...displayedSongs, ...newSongs],
        });
      }
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [
    loadingMore,
    hasMore,
    currentPage,
    allSongs,
    albumId,
    albumDetails,
    displayedSongs,
  ]);

  const fetchAlbumArtist = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        const allSongsData = cached.data.songs;
        setAllSongs(allSongsData);

        // Carrega primeira página
        const initialSongs = allSongsData.slice(0, SONGS_PER_PAGE);
        setDisplayedSongs(initialSongs);
        setHasMore(allSongsData.length > SONGS_PER_PAGE);
        setCurrentPage(1);

        setAlbumDetails({
          ...cached.data,
          songs: initialSongs,
        });
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

      // Carrega todas as músicas com capas
      const allSongsWithArt: SongWithArt[] = await Promise.all(
        album.songs.map(async (song) => ({
          ...song,
          coverArt: await fetchSongCoverArt(song.uri),
        })),
      );

      // ← Pega a primeira música com capa e converte para file://
      const firstSongWithCover = allSongsWithArt.find((s) => s.coverArt);
      const albumCoverUri = firstSongWithCover
        ? await fetchAndCacheCover(String(albumId), firstSongWithCover.uri)
        : album.coverArt;

      const initialSongs = allSongsWithArt.slice(0, SONGS_PER_PAGE);

      const details: AlbumWithDetails = {
        ...album,
        coverArt: albumCoverUri, // ← file:// garantido
        songs: initialSongs,
      };

      albumCache.set(albumId, {
        data: {
          ...album,
          coverArt: albumCoverUri, // ← salva file:// no cache também
          songs: allSongsWithArt,
        },
        timestamp: Date.now(),
      });

      if (isMounted.current) setAlbumDetails(details);
    } catch (err) {
      console.error("[useAlbumDetails] fetchAlbumArtist:", err);
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
        isLoadingRef.current = false;
      }
    }
  }, [albumId, groupedAlbums, fetchSongCoverArt]);

  const fetchAlbumLocal = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        const allSongsData = cached.data.songs;
        setAllSongs(allSongsData);

        const initialSongs = allSongsData.slice(0, SONGS_PER_PAGE);
        setDisplayedSongs(initialSongs);
        setHasMore(allSongsData.length > SONGS_PER_PAGE);
        setCurrentPage(1);

        setAlbumDetails({
          ...cached.data,
          songs: initialSongs,
        });
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

      const firstBatch = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: 1,
      });

      if (firstBatch.totalCount === 0) {
        console.warn("[fetchAlbumLocal] Nenhuma música encontrada");
        return;
      }

      const allAssets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: firstBatch.totalCount,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      const allSongsWithoutArt = allAssets.assets.map((s) => ({
        ...s,
        coverArt: undefined,
      })) as SongWithArt[];
      setAllSongs(allSongsWithoutArt);

      // Exibe apenas a primeira página imediatamente sem capas
      const initialSongs = allSongsWithoutArt.slice(0, SONGS_PER_PAGE);
      setDisplayedSongs(initialSongs);
      setHasMore(allSongsWithoutArt.length > SONGS_PER_PAGE);
      setCurrentPage(1);

      if (isMounted.current) {
        setAlbumDetails({
          id: albumId,
          title: albumMeta.title,
          assetCount: firstBatch.totalCount,
          coverArt: albumMeta.coverArt,
          songs: initialSongs,
        });
        setLoadingDetails(false);
      }

      // Carrega capas apenas das músicas visíveis primeiro (página atual)
      setLoadingCovers(true);
      const songsWithArt: SongWithArt[] = [...initialSongs];

      for (let i = 0; i < initialSongs.length; i += COVERS_BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) return;

        const batch = initialSongs.slice(i, i + COVERS_BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (song, idx) => ({
            index: i + idx,
            coverArt: await fetchSongCoverArt(song.uri),
          })),
        );

        results.forEach(({ index, coverArt }) => {
          if (coverArt) {
            songsWithArt[index] = { ...songsWithArt[index], coverArt };
          }
        });

        if (isMounted.current) {
          setAlbumDetails((prev) =>
            prev
              ? {
                  ...prev,
                  songs: songsWithArt,
                  coverArt:
                    songsWithArt.find((s) => s.coverArt)?.coverArt ??
                    prev.coverArt,
                }
              : prev,
          );

          // Atualiza allSongs também
          setAllSongs((prev) => {
            const updated = [...prev];
            results.forEach(({ index, coverArt }) => {
              if (coverArt && updated[index]) {
                updated[index] = { ...updated[index], coverArt };
              }
            });
            return updated;
          });
        }

        await new Promise((r) => setTimeout(r, 20));
      }

      setLoadingCovers(false);

      // Cache com todas as músicas
      albumCache.set(albumId, {
        data: {
          id: albumId,
          title: albumMeta.title,
          assetCount: firstBatch.totalCount,
          coverArt:
            songsWithArt.find((s) => s.coverArt)?.coverArt ??
            albumMeta.coverArt,
          songs: allSongsWithoutArt.map((song, idx) => ({
            ...song,
            coverArt: songsWithArt[idx]?.coverArt,
          })),
        },
        timestamp: Date.now(),
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
  }, [albumId, albums, fetchSongCoverArt]);

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
    albumCache.delete(albumId!);
    setAllSongs([]);
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
    totalSongsCount: allSongs.length,
    refreshAlbum,
  };
};
