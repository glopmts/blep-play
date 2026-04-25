import { createMMKV } from "react-native-mmkv";
import { GroupedAlbum, SongWithArt } from "../../types/interfaces";

export const storage = createMMKV({
  id: "albums-storage",
  mode: "multi-process",
});

const STORAGE_KEY = "grouped_albums_v1";
const ASSETS_CACHE_KEY = "assets_modification_hash";
const memoryCache = new Map<string, GroupedAlbum>();

type AlbumForStorage = Omit<GroupedAlbum, "coverArt" | "songs"> & {
  songs: Omit<SongWithArt, "coverArt">[];
};

export const albumsStoreSync = {
  // Salva álbuns
  save: (albums: GroupedAlbum[]) => {
    try {
      const stripped: AlbumForStorage[] = albums.map(
        ({ coverArt, songs, ...rest }) => ({
          ...rest,
          songs: songs.map(({ coverArt: _, ...song }) => song),
        }),
      );
      storage.set(STORAGE_KEY, JSON.stringify(stripped));
    } catch (e) {
      console.error("Erro ao salvar álbuns:", e);
    }
  },

  // Carrega álbuns
  load: (): AlbumForStorage[] => {
    try {
      const raw = storage.getString(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Salva hash de modificação
  saveModificationHash: (hash: string) => {
    try {
      storage.set(ASSETS_CACHE_KEY, hash);
    } catch (e) {
      console.error("Erro ao salvar hash:", e);
    }
  },

  // Carrega hash de modificação
  loadModificationHash: (): string | null => {
    try {
      return storage.getString(ASSETS_CACHE_KEY) || null;
    } catch {
      return null;
    }
  },

  // Cache em memória
  setMemory: (albums: GroupedAlbum[]) => {
    albums.forEach((a) => memoryCache.set(a.id, a));
  },

  findById: (id: string): GroupedAlbum | undefined => {
    return memoryCache.get(id);
  },

  hasMemory: () => memoryCache.size > 0,

  clear: () => {
    memoryCache.clear();
    storage.remove(STORAGE_KEY);
    storage.remove(ASSETS_CACHE_KEY);
  },
};
