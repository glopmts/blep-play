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

  // Previne operações enquanto outra está em andamento
  const operationInProgress = useRef(false);

  // Carrega todas as playlists do storage
  const loadAll = useCallback(async () => {
    try {
      const data = await getPlaylist();

      // Garante que músicas de cada playlist estão ordenadas (mais nova primeiro)
      const playlistsWithOrder = data.map((playlist) => ({
        ...playlist,
        songs: [...(playlist.songs ?? [])].reverse(), // Mais nova primeiro
      }));

      setPlaylists(playlistsWithOrder);
    } catch (error) {
      console.error("[usePlaylists] Erro ao carregar:", error);
    }
  }, []);

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
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

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
      if (operationInProgress.current) {
        return null;
      }

      operationInProgress.current = true;

      try {
        const updated = await addSongToPlaylist(playlistId, song);
        if (updated) {
          setPlaylists((prev) => {
            const newPlaylists = prev.map((p) =>
              p.id === playlistId ? updated : p,
            );
            return newPlaylists;
          });

          await loadAll();
        }
        showPlatformMessage("Musica adicionada com sucesso!");
        return updated;
      } catch (error) {
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [loadAll],
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
            prev.map((p) => (p.id === playlistId ? updated : p)),
          );
        }
        showPlatformMessage("Musica removida com sucesso!");
        handleRefresh();
        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao remover música:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [],
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

  // Atualizar dados da playlist (título, etc)
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
        }

        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao atualizar:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [],
  );

  // Buscar playlist por ID (do estado local)
  const findPlaylistById = useCallback(
    (id: string): Playlists | undefined => {
      return playlists.find((p) => p.id === id);
    },
    [playlists],
  );

  // Buscar playlist por ID (do storage - para dados frescos)
  const fetchPlaylistById = useCallback(async (id: string) => {
    return getPlaylistById(id);
  }, []);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const playlistData = await getPlaylistById(id);

      if (!playlistData) {
        Alert.alert("Playlist não encontrada!");
        return;
      }

      // Ordena músicas: mais recente primeiro
      const sortedSongs = [...(playlistData.songs ?? [])].reverse();

      const sortedPlaylist = {
        ...playlistData,
        songs: sortedSongs,
      };

      // Busca capa da primeira música (mais recente)
      if (sortedSongs.length > 0) {
        const firstSong = sortedSongs[0];
        const cover = await getTrackCoverSync(firstSong.filePath, firstSong.id);
        sortedPlaylist.coverArt = cover || "";
      }

      setPlaylist(sortedPlaylist);
    } catch (e) {
      console.error("Erro ao buscar Playlist", e);
      Alert.alert(
        "Erro ao buscar Playlist: " +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setLoading(false);
    }
  };

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
