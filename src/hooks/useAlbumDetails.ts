import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import { albumsStore } from "../store/albumsStore";
import { AlbumWithDetails, SongWithArt } from "../types/interfaces";
import { getSongCoverArt } from "../utils/getSongCoverArt";

interface AlbumParams {
  albumId?: string;
  type: "album_local" | "album_artist";
}

const albumCache = new Map<
  string,
  { data: AlbumWithDetails; timestamp: number }
>();
const coverArtCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const useAlbumDetails = ({ albumId, type }: AlbumParams) => {
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [albumDetails, setAlbumDetails] = useState<AlbumWithDetails | null>(
    null,
  );
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

  // BUSCA PELO ASYNCSTORAGE (album_artist)
  const fetchAlbumArtist = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    // 1. Verifica cache em memória
    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        setAlbumDetails(cached.data);
        setLoadingDetails(false);
      }
      return;
    }

    isLoadingRef.current = true;
    setLoadingDetails(true);

    try {
      // 2. Tenta memória do albumsStore (se ainda está na sessão)
      const fromMemory = albumsStore.findById(albumId);
      if (fromMemory) {
        const details: AlbumWithDetails = fromMemory;

        // Capa ainda não carregada? Busca em background
        if (!details.coverArt && details.songs[0]?.uri) {
          const coverArt = await fetchSongCoverArt(details.songs[0].uri);
          details.coverArt = coverArt;
        }

        albumCache.set(albumId, { data: details, timestamp: Date.now() });
        if (isMounted.current) {
          setAlbumDetails(details);
          setLoadingDetails(false);
        }
        return;
      }

      // 3. Fallback: lê direto do AsyncStorage (app reiniciado)
      const stored = await albumsStore.load();
      const found = stored.find((a) => a.id === albumId);

      if (!found) {
        if (isMounted.current) Alert.alert("Álbum não encontrado");
        return;
      }

      // Reconstrói o objeto com capa
      const coverArt = found.songs[0]?.uri
        ? await fetchSongCoverArt(found.songs[0].uri)
        : undefined;

      const details: AlbumWithDetails = {
        ...found,
        coverArt,
        songs: found.songs as SongWithArt[],
      };

      albumCache.set(albumId, { data: details, timestamp: Date.now() });
      if (isMounted.current) setAlbumDetails(details);
    } catch (err) {
      console.error("Erro ao buscar álbum do artista:", err);
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
        isLoadingRef.current = false;
      }
    }
  }, [albumId, fetchSongCoverArt]);

  // BUSCA PELO MEDIALIBRARY (album_local)─
  const fetchAlbumLocal = useCallback(async () => {
    if (!albumId || isLoadingRef.current) return;

    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        setAlbumDetails(cached.data);
        setLoadingDetails(false);
      }
      return;
    }

    isLoadingRef.current = true;
    setLoadingDetails(true);

    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const allAlbums = await MediaLibrary.getAlbumsAsync();
      const albumInfo = allAlbums.find((a) => a.id === albumId);

      if (!albumInfo) {
        if (isMounted.current) Alert.alert(`Álbum não encontrado: ${albumId}`);
        return;
      }

      const firstBatch = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: 1,
      });

      if (firstBatch.totalCount === 0) {
        if (isMounted.current) Alert.alert("Nenhuma música encontrada");
        return;
      }

      const allAssets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: firstBatch.totalCount,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      const songsWithArt: SongWithArt[] = [];
      const batchSize = 5;

      for (let i = 0; i < allAssets.assets.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) return;

        const batch = allAssets.assets.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (song) => ({
            ...song,
            coverArt: await fetchSongCoverArt(song.uri),
          })),
        );
        songsWithArt.push(...results);

        if (i + batchSize < allAssets.assets.length) {
          await new Promise((r) => setTimeout(r, 20));
        }
      }

      const details: AlbumWithDetails = {
        id: albumId,
        title: albumInfo.title || "Álbum sem título",
        assetCount: firstBatch.totalCount,
        coverArt: songsWithArt[0]?.coverArt,
        songs: songsWithArt,
      };

      albumCache.set(albumId, { data: details, timestamp: Date.now() });
      if (isMounted.current) setAlbumDetails(details);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Erro ao buscar álbum local:", err);
        if (isMounted.current)
          Alert.alert("Erro", "Não foi possível carregar o álbum");
      }
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
        isLoadingRef.current = false;
      }
    }
  }, [albumId, fetchSongCoverArt]);

  // DECIDE QUAL BUSCA USAR
  const fetchAlbum = useCallback(() => {
    if (type === "album_artist") return fetchAlbumArtist();
    return fetchAlbumLocal();
  }, [type, fetchAlbumArtist, fetchAlbumLocal]);

  useEffect(() => {
    isMounted.current = true;
    const timer = setTimeout(fetchAlbum, 100);

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
  }, [albumId, fetchAlbum]);

  const refreshAlbum = useCallback(() => {
    albumCache.delete(albumId!);
    fetchAlbum();
  }, [albumId, fetchAlbum]);

  return { albumDetails, loadingDetails, refreshAlbum };
};
