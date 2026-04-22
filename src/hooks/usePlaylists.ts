import { useCallback, useEffect, useRef, useState } from "react";
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
import { Playlists, SongWithArt } from "../types/interfaces";
import { fetchAndCacheCover } from "../utils/coverArtCache";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlists[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Previne operações enquanto outra está em andamento
  const operationInProgress = useRef(false);

  const getPlaylistCoverArt = async (
    playlist: Playlists,
  ): Promise<string | undefined> => {
    // Se já tem capa, retorna ela
    if (playlist.coverArt) return playlist.coverArt;

    // Se não tem músicas, retorna undefined
    if (!playlist.songs || playlist.songs.length === 0) return undefined;

    // Busca capa da primeira música
    const firstSong = playlist.songs[0];
    try {
      return await fetchAndCacheCover(firstSong.id, firstSong.uri);
    } catch (error) {
      console.error(`Erro ao buscar capa para música ${firstSong.id}:`, error);
      return undefined;
    }
  };

  // Carrega todas as playlists do storage
  const loadAll = useCallback(async () => {
    try {
      const data = await getPlaylist();

      // Busca capas em paralelo para melhor performance
      const playlistsWithCovers = await Promise.all(
        data.map(async (playlist) => ({
          ...playlist,
          coverArt: await getPlaylistCoverArt(playlist),
        })),
      );

      setPlaylists(playlistsWithCovers);
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
          // Re-sincroniza com o storage para garantir consistência
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

      return success;
    } catch (error) {
      console.error("[usePlaylists] Erro ao deletar:", error);
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
    async (playlistId: string, song: SongWithArt) => {
      if (operationInProgress.current) return null;
      operationInProgress.current = true;

      try {
        const updated = await addSongToPlaylist(playlistId, song);

        if (updated) {
          setPlaylists((prev) =>
            prev.map((p) => (p.id === playlistId ? updated : p)),
          );
        }

        return updated;
      } catch (error) {
        console.error("[usePlaylists] Erro ao adicionar música:", error);
        return null;
      } finally {
        operationInProgress.current = false;
      }
    },
    [],
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
    async (playlistId: string, songs: SongWithArt[]) => {
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

  return {
    // Estado
    playlists,
    isLoading,
    refreshing,

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
