import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "music-storage", mode: "multi-process" });

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
  albumId?: string;
  // Sempre file:// — nunca base64
  artwork?: string;
  duration?: number;
  playedAt?: number;
  addedAt?: number;
}

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
  } catch {}
}

// ─── Recentes

export async function addToRecents(track: StoredTrack): Promise<void> {
  // Rejeita base64 — só salva file:// ou http://
  const artwork = isValidArtworkUri(track.artwork) ? track.artwork : undefined;
  const list = readList(KEYS.RECENTS);
  const filtered = list.filter((t) => t.id !== track.id);
  const updated = [
    { ...track, artwork, playedAt: Date.now() },
    ...filtered,
  ].slice(0, MAX_RECENTS);
  writeList(KEYS.RECENTS, updated);
}

export async function getRecents(): Promise<StoredTrack[]> {
  return readList(KEYS.RECENTS);
}

export async function clearRecents(): Promise<void> {
  storage.remove(KEYS.RECENTS);
}

export async function removeFromRecents(trackId: string): Promise<void> {
  writeList(
    KEYS.RECENTS,
    readList(KEYS.RECENTS).filter((t) => t.id !== trackId),
  );
}

// ─── Favoritos

export async function addToFavorites(track: StoredTrack): Promise<void> {
  const list = readList(KEYS.FAVORITES);
  if (list.some((t) => t.id === track.id)) return;
  const artwork = isValidArtworkUri(track.artwork) ? track.artwork : undefined;
  writeList(KEYS.FAVORITES, [
    { ...track, artwork, addedAt: Date.now() },
    ...list,
  ]);
}

export async function removeFromFavorites(trackId: string): Promise<void> {
  writeList(
    KEYS.FAVORITES,
    readList(KEYS.FAVORITES).filter((t) => t.id !== trackId),
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
    return false;
  }
  const artwork = isValidArtworkUri(track.artwork) ? track.artwork : undefined;
  writeList(KEYS.FAVORITES, [
    { ...track, artwork, addedAt: Date.now() },
    ...list,
  ]);
  return true;
}

export async function getFavorites(): Promise<StoredTrack[]> {
  return readList(KEYS.FAVORITES);
}

export async function isFavorite(trackId: string): Promise<boolean> {
  return readList(KEYS.FAVORITES).some((t) => t.id === trackId);
}

export async function clearFavorites(): Promise<void> {
  storage.remove(KEYS.FAVORITES);
}

export async function clearAllMusicData(): Promise<void> {
  storage.remove(KEYS.RECENTS);
  storage.remove(KEYS.FAVORITES);
}

// ─── Utilitário

function isValidArtworkUri(uri?: string): boolean {
  if (!uri) return false;
  return uri.startsWith("file://") || uri.startsWith("http");
}

export function getStorageStats() {
  return {
    recentsCount: readList(KEYS.RECENTS).length,
    favoritesCount: readList(KEYS.FAVORITES).length,
    totalSize: storage.byteSize,
  };
}

export const musicStorageSync = {
  getRecents: (): StoredTrack[] => readList(KEYS.RECENTS),
  getFavorites: (): StoredTrack[] => readList(KEYS.FAVORITES),
  isFavorite: (id: string) => readList(KEYS.FAVORITES).some((t) => t.id === id),
  addToRecents: (track: StoredTrack) => {
    const artwork = isValidArtworkUri(track.artwork)
      ? track.artwork
      : undefined;
    const list = readList(KEYS.RECENTS);
    const filtered = list.filter((t) => t.id !== track.id);
    writeList(
      KEYS.RECENTS,
      [{ ...track, artwork, playedAt: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENTS,
      ),
    );
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
    }
    const artwork = isValidArtworkUri(track.artwork)
      ? track.artwork
      : undefined;
    writeList(KEYS.FAVORITES, [
      { ...track, artwork, addedAt: Date.now() },
      ...list,
    ]);
    return true;
  },
};
