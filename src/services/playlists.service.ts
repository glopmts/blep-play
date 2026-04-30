import AsyncStorage from "@react-native-async-storage/async-storage";
import { Playlists, TrackDetails } from "../types/interfaces";

const KEYS = {
  PLAYLISTS: "playlists_v3",
} as const;

// Limite máximo de tamanho (4MB para ter margem de segurança)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024;

// Mutex simples para evitar race conditions
let writeLock: Promise<void> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const currentLock = writeLock;
  let resolve: () => void;
  writeLock = new Promise<void>((r) => {
    resolve = r;
  });

  try {
    await currentLock;
    return await fn();
  } finally {
    resolve!();
  }
}

/**
 * Remove campos pesados das músicas para economizar espaço
 * Mantém apenas os campos essenciais para identificação e reprodução
 */
function minimizeSong(song: TrackDetails): Partial<TrackDetails> {
  return {
    id: song.id,
    uri: song.uri,
    duration: song.duration,
    title: song.title,
    artist: song.artist,
    album: song.album,
    filePath: song.filePath,
    // NÃO salva coverArt base64 - será carregado dinamicamente
    // NÃO salva lyrics - muito grande
    mimeType: song.mimeType,
  };
}

/**
 * Minimiza playlist para economizar espaço
 */
function minimizePlaylist(playlist: Playlists): Playlists {
  return {
    id: playlist.id,
    title: playlist.title,
    musicId: playlist.musicId,
    playedAt: playlist.playedAt,
    customCoverArt: playlist.customCoverArt ?? null,
    songs: (playlist.songs ?? []).map(minimizeSong) as TrackDetails[],
  };
}

async function readPlaylists(): Promise<Playlists[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PLAYLISTS);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn("[Playlists] Dados corrompidos, resetando...");
      return [];
    }

    return parsed.filter(
      (p): p is Playlists =>
        typeof p === "object" &&
        p !== null &&
        typeof p.id === "string" &&
        typeof p.title === "string",
    );
  } catch (error) {
    console.error("[Playlists] Erro ao ler:", error);
    return [];
  }
}

async function writePlaylists(list: Playlists[]): Promise<boolean> {
  try {
    // Minimiza todas as playlists antes de salvar
    const minimized = list.map(minimizePlaylist);
    const data = JSON.stringify(minimized);

    // Verifica tamanho antes de salvar
    const size = new Blob([data]).size;
    if (size > MAX_STORAGE_SIZE) {
      console.error(
        `[Playlists] Dados muito grandes: ${(size / 1024 / 1024).toFixed(2)}MB`,
      );
      // Tenta remover playlists antigas para liberar espaço
      const trimmed = minimized.slice(0, Math.ceil(minimized.length / 2));
      const trimmedData = JSON.stringify(trimmed);
      console.warn(
        `[Playlists] Removendo playlists antigas. De ${minimized.length} para ${trimmed.length}`,
      );
      await AsyncStorage.setItem(KEYS.PLAYLISTS, trimmedData);
      return true;
    }

    await AsyncStorage.setItem(KEYS.PLAYLISTS, data);
    return true;
  } catch (error) {
    console.error("[Playlists] Erro ao salvar:", error);

    // Se ainda falhar, tenta limpar dados antigos
    if (error instanceof Error && error.message.includes("SQLITE_FULL")) {
      console.warn(
        "[Playlists] Storage cheio, tentando limpar versões antigas...",
      );
      try {
        // Remove versões antigas
        await AsyncStorage.multiRemove(["playlists", "playlists_v2"]);
        // Tenta salvar novamente com menos dados
        const minimal = list.slice(0, 5).map(minimizePlaylist);
        await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(minimal));
        console.warn("[Playlists] Recuperado com dados mínimos");
        return true;
      } catch {
        console.error("[Playlists] Falha na recuperação");
      }
    }

    return false;
  }
}

/**
 * Retorna estatísticas do storage para debug
 */
export async function getStorageStats(): Promise<{
  size: number;
  count: number;
  sizeFormatted: string;
}> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PLAYLISTS);
    const size = raw ? new Blob([raw]).size : 0;
    const list = raw ? JSON.parse(raw) : [];
    return {
      size,
      count: Array.isArray(list) ? list.length : 0,
      sizeFormatted: `${(size / 1024).toFixed(2)}KB`,
    };
  } catch {
    return { size: 0, count: 0, sizeFormatted: "0KB" };
  }
}

/**
 * Limpa versões antigas do storage
 */
export async function cleanupOldStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(["playlists", "playlists_v2"]);
  } catch (error) {
    console.warn("[Playlists] Erro ao limpar versões antigas:", error);
  }
}

// ─── Operações Públicas (todas protegidas por lock) ───

export async function getPlaylist(): Promise<Playlists[]> {
  return readPlaylists();
}

export async function getPlaylistById(id: string): Promise<Playlists | null> {
  const list = await readPlaylists();
  return list.find((p) => p.id === id) ?? null;
}

export async function createPlaylist(
  playlist: Omit<Playlists, "playedAt">,
): Promise<Playlists | null> {
  return withLock(async () => {
    const list = await readPlaylists();

    if (list.some((p) => p.id === playlist.id)) {
      console.warn("[Playlists] Playlist já existe:", playlist.id);
      return list.find((p) => p.id === playlist.id) ?? null;
    }

    const newPlaylist: Playlists = {
      id: playlist.id,
      title: playlist.title,
      musicId: playlist.musicId,
      customCoverArt: playlist.customCoverArt,
      songs: playlist.songs ?? [], // Mantém a ordem original
      playedAt: Date.now(),
    };

    // Nova playlist no topo da lista de playlists
    const updated = [newPlaylist, ...list];
    const success = await writePlaylists(updated);

    return success ? newPlaylist : null;
  });
}

export async function removeFromPlaylist(playlistId: string): Promise<boolean> {
  return withLock(async () => {
    const list = await readPlaylists();
    const filtered = list.filter((p) => p.id !== playlistId);

    if (filtered.length === list.length) {
      console.warn("[Playlists] Playlist não encontrada:", playlistId);
      return false;
    }

    return writePlaylists(filtered);
  });
}

export async function clearPlaylist(): Promise<boolean> {
  return withLock(async () => {
    try {
      await AsyncStorage.removeItem(KEYS.PLAYLISTS);
      return true;
    } catch {
      return false;
    }
  });
}

export async function addSongToPlaylist(
  playlistId: string,
  song: TrackDetails,
): Promise<Playlists | null> {
  return withLock(async () => {
    const list = await readPlaylists();
    const playlistIndex = list.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      console.warn("[Playlists] Playlist não encontrada:", playlistId);
      return null;
    }

    const playlist = list[playlistIndex];
    const songs = playlist.songs ?? [];

    if (songs.some((s) => s.id === song.id)) {
      console.warn("[Playlists] Música já existe na playlist:", song.id);
      return playlist;
    }

    const updatedPlaylist: Playlists = {
      ...playlist,
      songs: [song, ...songs],
    };

    const updated = [...list];
    updated[playlistIndex] = updatedPlaylist;

    const success = await writePlaylists(updated);
    return success ? updatedPlaylist : null;
  });
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string,
): Promise<Playlists | null> {
  return withLock(async () => {
    const list = await readPlaylists();
    const playlistIndex = list.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      console.warn("[Playlists] Playlist não encontrada:", playlistId);
      return null;
    }

    const playlist = list[playlistIndex];
    const newSongs = (playlist.songs ?? []).filter((s) => s.id !== songId);

    const updatedPlaylist: Playlists = {
      ...playlist,
      songs: newSongs,
    };

    const updated = [...list];
    updated[playlistIndex] = updatedPlaylist;

    const success = await writePlaylists(updated);
    return success ? updatedPlaylist : null;
  });
}

export async function setPlaylistSongs(
  playlistId: string,
  songs: TrackDetails[],
): Promise<Playlists | null> {
  return withLock(async () => {
    const list = await readPlaylists();
    const playlistIndex = list.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      console.warn("[Playlists] Playlist não encontrada:", playlistId);
      return null;
    }

    const updatedPlaylist: Playlists = {
      ...list[playlistIndex],
      songs,
    };

    const updated = [...list];
    updated[playlistIndex] = updatedPlaylist;

    const success = await writePlaylists(updated);
    return success ? updatedPlaylist : null;
  });
}

export async function updatePlaylist(
  playlistId: string,
  updates: Partial<Omit<Playlists, "id">>,
): Promise<Playlists | null> {
  return withLock(async () => {
    const list = await readPlaylists();
    const playlistIndex = list.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      console.warn("[Playlists] Playlist não encontrada:", playlistId);
      return null;
    }

    const updatedPlaylist: Playlists = {
      ...list[playlistIndex],
      ...updates,
    };

    const updated = [...list];
    updated[playlistIndex] = updatedPlaylist;

    const success = await writePlaylists(updated);
    return success ? updatedPlaylist : null;
  });
}
