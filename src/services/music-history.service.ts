import AsyncStorage from "@react-native-async-storage/async-storage";

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

async function readList(key: string): Promise<StoredTrack[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeList(key: string, list: StoredTrack[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

// ─── Recentes

export async function addToRecents(track: StoredTrack): Promise<void> {
  const list = await readList(KEYS.RECENTS);

  // Remove se já existia (vai para o topo)
  const filtered = list.filter((t) => t.id !== track.id);

  const updated = [{ ...track, playedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENTS,
  ); // mantém só os últimos 30

  await writeList(KEYS.RECENTS, updated);
}

export async function getRecents(): Promise<StoredTrack[]> {
  return readList(KEYS.RECENTS);
}

export async function clearRecents(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.RECENTS);
}

export async function removeFromRecents(trackId: string): Promise<void> {
  const list = await readList(KEYS.RECENTS);
  await writeList(
    KEYS.RECENTS,
    list.filter((t) => t.id !== trackId),
  );
}

// ─── Favoritos

export async function addToFavorites(track: StoredTrack): Promise<void> {
  const list = await readList(KEYS.FAVORITES);
  if (list.some((t) => t.id === track.id)) return; // já existe
  await writeList(KEYS.FAVORITES, [{ ...track, addedAt: Date.now() }, ...list]);
}

export async function removeFromFavorites(trackId: string): Promise<void> {
  const list = await readList(KEYS.FAVORITES);
  await writeList(
    KEYS.FAVORITES,
    list.filter((t) => t.id !== trackId),
  );
}

export async function toggleFavorite(track: StoredTrack): Promise<boolean> {
  const list = await readList(KEYS.FAVORITES);
  const exists = list.some((t) => t.id === track.id);
  if (exists) {
    await writeList(
      KEYS.FAVORITES,
      list.filter((t) => t.id !== track.id),
    );
    return false; // removido
  } else {
    await writeList(KEYS.FAVORITES, [
      { ...track, addedAt: Date.now() },
      ...list,
    ]);
    return true; // adicionado
  }
}

export async function getFavorites(): Promise<StoredTrack[]> {
  return readList(KEYS.FAVORITES);
}

export async function isFavorite(trackId: string): Promise<boolean> {
  const list = await readList(KEYS.FAVORITES);
  return list.some((t) => t.id === trackId);
}

export async function clearFavorites(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.FAVORITES);
}
