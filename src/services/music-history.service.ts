import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({
  id: "music-storage",
  mode: "multi-process",
});

const KEYS = {
  RECENTS: "music_recents_v1",
  FAVORITES: "music_favorites_v1",
} as const;

const MAX_RECENTS = 15;

export interface StoredTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
  playedAt?: number; // timestamp — só em recentes
  addedAt?: number; // timestamp — só em favoritos
}

// ─── Helpers

function readList(key: string): StoredTrack[] {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: StoredTrack[]): void {
  try {
    storage.set(key, JSON.stringify(list));
  } catch {
    // Silencia erro
  }
}

// ─── Recentes

export async function addToRecents(track: StoredTrack): Promise<void> {
  const list = readList(KEYS.RECENTS);

  // Remove se já existia (vai para o topo)
  const filtered = list.filter((t) => t.id !== track.id);

  const updated = [{ ...track, playedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENTS,
  );

  writeList(KEYS.RECENTS, updated);
}

export async function getRecents(): Promise<StoredTrack[]> {
  return readList(KEYS.RECENTS);
}

export async function clearRecents(): Promise<void> {
  storage.remove(KEYS.RECENTS);
}

export async function removeFromRecents(trackId: string): Promise<void> {
  const list = readList(KEYS.RECENTS);
  writeList(
    KEYS.RECENTS,
    list.filter((t) => t.id !== trackId),
  );
}

// ─── Favoritos

export async function addToFavorites(track: StoredTrack): Promise<void> {
  const list = readList(KEYS.FAVORITES);
  if (list.some((t) => t.id === track.id)) return; // já existe
  writeList(KEYS.FAVORITES, [{ ...track, addedAt: Date.now() }, ...list]);
}

export async function removeFromFavorites(trackId: string): Promise<void> {
  const list = readList(KEYS.FAVORITES);
  writeList(
    KEYS.FAVORITES,
    list.filter((t) => t.id !== trackId),
  );
}

export async function toggleFavorite(track: StoredTrack): Promise<boolean> {
  const list = readList(KEYS.FAVORITES);
  const exists = list.some((t) => t.id === track.id);
  if (exists) {
    writeList(
      KEYS.FAVORITES,
      list.filter((t) => t.id !== track.id),
    );
    return false; // removido
  } else {
    writeList(KEYS.FAVORITES, [{ ...track, addedAt: Date.now() }, ...list]);
    return true; // adicionado
  }
}

export async function getFavorites(): Promise<StoredTrack[]> {
  return readList(KEYS.FAVORITES);
}

export async function isFavorite(trackId: string): Promise<boolean> {
  const list = readList(KEYS.FAVORITES);
  return list.some((t) => t.id === trackId);
}

export async function clearFavorites(): Promise<void> {
  storage.remove(KEYS.FAVORITES);
}

// ─── Utilitários adicionais para MMKV

// Obter estatísticas do cache
export function getStorageStats() {
  return {
    recentsCount: readList(KEYS.RECENTS).length,
    favoritesCount: readList(KEYS.FAVORITES).length,
    totalSize: storage.size,
  };
}

// Limpar todo o storage de música
export async function clearAllMusicData(): Promise<void> {
  storage.remove(KEYS.RECENTS);
  storage.remove(KEYS.FAVORITES);
}

// Versão síncrona para uso em contextos específicos
export const musicStorageSync = {
  getRecents: (): StoredTrack[] => readList(KEYS.RECENTS),
  getFavorites: (): StoredTrack[] => readList(KEYS.FAVORITES),
  isFavorite: (trackId: string): boolean => {
    const list = readList(KEYS.FAVORITES);
    return list.some((t) => t.id === trackId);
  },
  addToRecents: (track: StoredTrack): void => {
    const list = readList(KEYS.RECENTS);
    const filtered = list.filter((t) => t.id !== track.id);
    const updated = [{ ...track, playedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_RECENTS,
    );
    writeList(KEYS.RECENTS, updated);
  },
  toggleFavorite: (track: StoredTrack): boolean => {
    const list = readList(KEYS.FAVORITES);
    const exists = list.some((t) => t.id === track.id);
    if (exists) {
      writeList(
        KEYS.FAVORITES,
        list.filter((t) => t.id !== track.id),
      );
      return false;
    } else {
      writeList(KEYS.FAVORITES, [{ ...track, addedAt: Date.now() }, ...list]);
      return true;
    }
  },
};
