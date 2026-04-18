import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";
import { albumsStore } from "../store/albumsStore";
import { GroupedAlbum, SongWithArt } from "../types/interfaces";
import { getSongCoverArt } from "../utils/getSongCoverArt";
import { extractMusicMetadata, generateAlbumId } from "../utils/musicMetadata";

const ASSETS_CACHE_KEY = "assets_modification_hash";

export const useAlbumsGrouped = () => {
  const [albums, setAlbums] = useState<GroupedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (permissionResponse?.granted) {
      initAlbums();
    }
  }, [permissionResponse?.granted]);

  const initAlbums = async () => {
    setLoading(true);

    // Passo 1: carrega metadados do AsyncStorage (rápido, sem capas)
    const stored = await albumsStore.load();
    if (stored.length > 0) {
      // Exibe sem capas primeiro
      const withoutArt = stored.map((a) => ({
        ...a,
        coverArt: undefined,
        songs: a.songs.map((s) => ({ ...s, coverArt: undefined })),
      }));
      albumsStore.setMemory(withoutArt as GroupedAlbum[]);
      setAlbums(withoutArt as GroupedAlbum[]);
      setLoading(false);
    }

    // Passo 2: verifica mudanças e reprocessa se necessário
    const hasChanges = await checkForChanges();
    if (!hasChanges && stored.length > 0) {
      // Só carrega as capas em background
      loadCoversInBackground(stored as any);
      return;
    }

    // Passo 3: reprocessa tudo (arquivos mudaram)
    await loadGroupedAlbums();
  };

  const loadCoversInBackground = async (albums: GroupedAlbum[]) => {
    const updated = await Promise.all(
      albums.map(async (album) => {
        const coverArt = await getSongCoverArt(album.songs[0]?.uri);
        const updatedSongs = album.songs.map((s) => ({ ...s, coverArt }));
        return { ...album, coverArt, songs: updatedSongs };
      }),
    );
    albumsStore.setMemory(updated);
    setAlbums(updated);
  };

  // Compara timestamp da última modificação para detectar mudanças
  const checkForChanges = async (): Promise<boolean> => {
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: ["audio"],
        first: 1,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      const latestModification = assets.assets[0]?.modificationTime ?? 0;
      const savedHash = await AsyncStorage.getItem(ASSETS_CACHE_KEY);

      if (String(latestModification) !== savedHash) {
        await AsyncStorage.setItem(
          ASSETS_CACHE_KEY,
          String(latestModification),
        );
        return true; // tem mudanças
      }
      return false;
    } catch {
      return true; // em caso de erro, reprocessa
    }
  };

  const loadGroupedAlbums = async () => {
    setLoading(true);
    try {
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

        if (!albumMap.has(albumKey)) {
          albumMap.set(albumKey, []);
        }
        albumMap.get(albumKey)!.push(song);
      }

      const groupedAlbums: GroupedAlbum[] = [];

      for (const [albumKey, songs] of albumMap.entries()) {
        const firstSong = songs[0];
        const metadata = extractMusicMetadata(firstSong.filename);
        const coverArt = await getSongCoverArt(firstSong.uri);

        groupedAlbums.push({
          id: albumKey,
          title: metadata.artist,
          artistName: metadata.artist,
          albumName: metadata.albumName,
          assetCount: songs.length,
          coverArt,
          songs,
        });
      }

      groupedAlbums.sort((a, b) => a.artistName.localeCompare(b.artistName));

      // Salva no AsyncStorage
      await albumsStore.save(groupedAlbums);

      setAlbums(groupedAlbums);
    } catch (error) {
      console.error("Erro ao carregar álbuns:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    albums,
    loading,
    permissionResponse,
    requestPermission,
    refreshAlbums: loadGroupedAlbums,
  };
};
