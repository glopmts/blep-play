import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { showPlatformMessage } from "../components/toast-message-plataform";
import {
  addSongToPlaylist,
  cleanupOldStorage,
  clearPlaylist,
  createPlaylist,
  getPlaylist,
  getPlaylistById,
  getStorageStats,
  removeFromPlaylist,
  removeSongFromPlaylist,
  setPlaylistSongs,
  updatePlaylist,
} from "../services/playlists.service";
import { Playlists, TrackDetails } from "../types/interfaces";
import { getTrackCoverSync } from "./useTrackCover";

export function usePlaylists(id?: string | null) {
  const [playlists, setPlaylists] = useState<Playlists[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playlist, setPlaylist] = useState<Playlists | null>(null);

  const operationInProgress = useRef(false);

  // Função para verificar se a imagem personalizada ainda existe
  const checkCustomCoverExists = useCallback(
    async (coverPath: string | null | undefined): Promise<boolean> => {
      if (!coverPath) return false;
      try {
        const fileInfo = await FileSystem.getInfoAsync(coverPath);
        return fileInfo.exists;
      } catch {
        return false;
      }
    },
    [],
  );

  // Função para obter a capa da playlist (prioriza capa personalizada)
  const getPlaylistCover = useCallback(
    async (playlist: Playlists): Promise<string | null> => {
      // 1. Verificar se existe capa personalizada
      if (playlist.customCoverArt) {
        const exists = await checkCustomCoverExists(playlist.customCoverArt);
        if (exists) {
          return playlist.customCoverArt;
        }
        // Se a imagem não existe mais, limpar a referência
        if (playlist.customCoverArt) {
          await updatePlaylist(playlist.id, { customCoverArt: null });
        }
      }

      // 2. Se não tem capa personalizada, usar a capa da primeira música
      if (playlist.songs && playlist.songs.length > 0) {
        const firstSong = playlist.songs[0];
        const songCover = await getTrackCoverSync(
          firstSong.filePath,
          firstSong.id,
        );
        if (songCover) {
          return songCover;
        }
      }

      return null;
    },
    [checkCustomCoverExists, getTrackCoverSync],
  );

  // Carrega todas as playlists do storage
  const loadAll = useCallback(async () => {
    try {
      const data = await getPlaylist();

      const playlistsWithCovers = await Promise.all(
        data.map(async (playlist) => {
          const coverArt = await getPlaylistCover(playlist);

          return {
            ...playlist,
            coverArt, // Capa calculada (personalizada ou da música)
          };
        }),
      );

      setPlaylists(playlistsWithCovers);
    } catch (error) {
      console.error("[usePlaylists] Erro ao carregar:", error);
    }
  }, [getPlaylistCover]);

  // Carregamento inicial + limpeza de versões antigas
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await cleanupOldStorage();
        await loadAll();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadAll]);

  // Refresh manual (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
      if (id) {
        await fetchData();
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadAll, id]);

  const fetchPlaylistById = useCallback(
    async (id: string) => {
      try {
        const playlistData = await getPlaylistById(id);
        if (!playlistData) return null;

        const sortedSongs = [...(playlistData.songs ?? [])];
        const sortedPlaylist = { ...playlistData, songs: sortedSongs };

        // Usar a nova lógica para obter a capa
        const cover = await getPlaylistCover(sortedPlaylist);
        sortedPlaylist.coverArt = cover || undefined;

        return sortedPlaylist;
      } catch (e) {
        console.error("Erro ao buscar Playlist", e);
        Alert.alert(
          "Erro ao buscar Playlist: " +
            (e instanceof Error ? e.message : String(e)),
        );
        return null;
      }
    },
    [getPlaylistCover],
  );

  const findPlaylistById = useCallback(
    (id: string): Playlists | undefined => {
      return playlists.find((p) => p.id === id);
    },
    [playlists],
  );

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const playlistData = await fetchPlaylistById(id);
      setPlaylist(playlistData);
    } finally {
      setLoading(false);
    }
  }, [id, fetchPlaylistById]);

  // Criar nova playlist
  const handleCreatePlaylist = useCallback(
    async (playlist: Omit<Playlists, "playedAt">) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const created = await createPlaylist(playlist);

        if (created) {
          await loadAll();
        }

        return created;
      } catch (error) {
        console.error("[usePlaylists] Erro ao criar:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [loadAll],
  );

  // Deletar playlist
  const handleDeletePlaylist = useCallback(async (playlistId: string) => {
    if (operationInProgress.current) return false;
    operationInProgress.current = true;

    try {
      const success = await removeFromPlaylist(playlistId);

      if (success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      }

      showPlatformMessage("Playlist deletada com sucesso!");
      handleRefresh();
      return success;
    } catch (error) {
      console.error("[usePlaylists] Erro ao deletar:", error);
      showPlatformMessage("[usePlaylists] Erro ao deletar:");
      return false;
    } finally {
      operationInProgress.current = false;
    }
  }, []);

  // Limpar todas as playlists
  const handleClearPlaylists = useCallback(async () => {
    if (operationInProgress.current) return false;
    operationInProgress.current = true;

    try {
      const success = await clearPlaylist();

      if (success) {
        setPlaylists([]);
      }
      handleRefresh();
      return success;
    } catch (error) {
      console.error("[usePlaylists] Erro ao limpar:", error);
      return false;
    } finally {
      operationInProgress.current = false;
    }
  }, []);

  // Adicionar música a uma playlist
  const handleAddSongToPlaylist = useCallback(
    async (playlistId: string, song: TrackDetails) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const updated = await addSongToPlaylist(playlistId, song);
        if (updated) {
          // Atualiza a playlist localmente
          setPlaylists((prev) => {
            const newPlaylists = prev.map((p) =>
              p.id === playlistId
                ? {
                    ...p,
                    songs: [song, ...p.songs],
                  }
                : p,
            );
            return newPlaylists;
          });

          if (playlist?.id === playlistId) {
            const updatedPlaylist = await fetchPlaylistById(playlistId);
            setPlaylist(updatedPlaylist);
          }

          showPlatformMessage("Música adicionada com sucesso!");
        }
        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao adicionar música:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [playlist, fetchPlaylistById],
  );

  // Remover música de uma playlist
  const handleRemoveSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const updated = await removeSongFromPlaylist(playlistId, songId);
        if (updated) {
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlistId
                ? {
                    ...p,
                    songs: p.songs.filter((s) => s.id !== songId),
                  }
                : p,
            ),
          );

          if (playlist?.id === playlistId) {
            const updatedPlaylist = await fetchPlaylistById(playlistId);
            setPlaylist(updatedPlaylist);
          }

          showPlatformMessage("Música removida com sucesso!");
        }
        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao remover música:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [playlist, fetchPlaylistById],
  );

  // Substituir todas as músicas de uma playlist
  const handleSetPlaylistSongs = useCallback(
    async (playlistId: string, songs: TrackDetails[]) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const updated = await setPlaylistSongs(playlistId, songs);

        if (updated) {
          setPlaylists((prev) =>
            prev.map((p) => (p.id === playlistId ? updated : p)),
          );
        }

        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao definir músicas:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [],
  );

  // Atualizar dados da playlist (incluindo customCoverArt)
  const handleUpdatePlaylist = useCallback(
    async (playlistId: string, updates: Partial<Omit<Playlists, "id">>) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const updated = await updatePlaylist(playlistId, updates);

        if (updated) {
          setPlaylists((prev) =>
            prev.map((p) => (p.id === playlistId ? updated : p)),
          );

          if (playlist?.id === playlistId) {
            const newCover = await getPlaylistCover(updated);
            setPlaylist({ ...updated, coverArt: newCover || undefined });
          }
        }

        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao atualizar:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [playlist, getPlaylistCover],
  );

  useEffect(() => {
    fetchData();
  }, [id]);

  return {
    // Estado
    playlists,
    isLoading,
    refreshing,
    playlist,
    // Ações
    loadAll,
    handleRefresh,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleClearPlaylists,
    handleAddSongToPlaylist,
    handleRemoveSongFromPlaylist,
    handleSetPlaylistSongs,
    handleUpdatePlaylist,

    // Buscas
    findPlaylistById,
    fetchPlaylistById,

    // Legado (para compatibilidade)
    handleCreaterPlaylist: handleCreatePlaylist,
    getPlaylistById: fetchPlaylistById,

    // Debug/utilidades
    getStorageStats,
  };
}
