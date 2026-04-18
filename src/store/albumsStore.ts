import AsyncStorage from "@react-native-async-storage/async-storage";
import { GroupedAlbum, SongWithArt } from "../types/interfaces";

const STORAGE_KEY = "grouped_albums_v1";

// Cache em memória com as capas (não persiste, mas é rápido)
const memoryCache = new Map<string, GroupedAlbum>();

type AlbumForStorage = Omit<GroupedAlbum, "coverArt" | "songs"> & {
  songs: Omit<SongWithArt, "coverArt">[];
};

export const albumsStore = {
  // Salva sem coverArt (muito grande para AsyncStorage)
  save: async (albums: GroupedAlbum[]) => {
    try {
      const stripped: AlbumForStorage[] = albums.map(
        ({ coverArt, songs, ...rest }) => ({
          ...rest,
          songs: songs.map(({ coverArt: _, ...song }) => song),
        }),
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch (e) {
      console.error("Erro ao salvar álbuns:", e);
    }
  },

  // Carrega metadados do AsyncStorage
  load: async (): Promise<AlbumForStorage[]> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Cache em memória (com capas, volátil)
  setMemory: (albums: GroupedAlbum[]) => {
    albums.forEach((a) => memoryCache.set(a.id, a));
  },

  findById: (id: string): GroupedAlbum | undefined => {
    return memoryCache.get(id);
  },

  hasMemory: () => memoryCache.size > 0,

  clear: async () => {
    memoryCache.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
