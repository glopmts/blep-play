import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { AlbumWithDetails } from "../types/interfaces";
import { getSongCoverArt } from "../utils/getSongCoverArt";

const coverArtCache = new Map<string, string>();

interface AlbumParams {
  albumId?: string;
}

export const useAlbum = ({ albumId }: AlbumParams) => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (permissionResponse?.granted) {
      loadAlbumsWithDetails();
    }
  }, [permissionResponse?.granted]);

  const getLatestSongFromAlbum = async (albumId: string) => {
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: ["audio"],
        first: 1,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      return assets.assets[0];
    } catch (error) {
      console.error("Erro ao buscar última música:", error);
      return undefined;
    }
  };

  const getAlbumCoverArt = async (
    albumId: string,
  ): Promise<string | undefined> => {
    // Verifica cache primeiro
    if (coverArtCache.has(albumId)) {
      return coverArtCache.get(albumId);
    }

    try {
      const latestSong = await getLatestSongFromAlbum(albumId);

      if (!latestSong) return undefined;

      const coverArt = await getSongCoverArt(latestSong.uri);

      // Salva no cache
      if (coverArt) {
        coverArtCache.set(albumId, coverArt);
      }

      return coverArt;
    } catch (error) {
      console.error("Erro ao buscar capa do álbum:", error);
      return undefined;
    }
  };

  const loadAlbumsWithDetails = async () => {
    setLoading(true);
    try {
      const fetchedAlbums = await MediaLibrary.getAlbumsAsync();

      const albumsWithMusic = await Promise.all(
        fetchedAlbums.map(async (album) => {
          const first = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["audio"],
            first: 1,
          });

          if (first.totalCount === 0) return null;

          // Busca todas as músicas ordenadas
          const allAssets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["audio"],
            first: first.totalCount,
            sortBy: [MediaLibrary.SortBy.modificationTime],
          });

          const coverArt = await getAlbumCoverArt(album.id);

          return {
            id: album.id,
            title: album.title || "Álbum sem título",
            assetCount: first.totalCount,
            coverArt,
            songs: allAssets.assets,
            // Adiciona a última música como destaque
            latestSong: allAssets.assets[0],
          };
        }),
      );

      const validAlbums = albumsWithMusic.filter(
        (album): album is NonNullable<typeof album> => album !== null,
      );

      setAlbums(validAlbums);
    } catch (error) {
      console.error("Erro ao carregar álbuns:", error);
      Alert.alert("Erro", "Não foi possível carregar os álbuns");
    } finally {
      setLoading(false);
    }
  };

  const clearCoverCache = () => {
    coverArtCache.clear();
  };
  const selectAlbum = async (album: AlbumWithDetails) => {
    setSelectedAlbum(album);
  };

  return {
    albums,
    selectedAlbum,
    loading,
    permissionResponse,

    requestPermission,
    selectAlbum,
    clearCoverCache,
    refreshAlbums: loadAlbumsWithDetails,
  };
};
