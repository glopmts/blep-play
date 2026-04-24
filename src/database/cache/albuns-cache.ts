import { createMMKV } from "react-native-mmkv";
import { AlbumWithDetails } from "../../types/interfaces";

// Inicializa o MMKV com configurações otimizadas
export const storage = createMMKV({
  id: "albums-cache",
  encryptionKey: undefined, // Sem criptografia para performance
  mode: "multi-process", // Melhor performance
});

const CACHE_KEY_ALBUMS = "albums_meta_v2";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Interface para o cache
interface CachedAlbumData {
  data: Omit<AlbumWithDetails, "coverArt" | "songs">[];
  ts: number;
}

// Leitura do cache
export async function readAlbumsMeta(): Promise<CachedAlbumData | null> {
  try {
    const raw = storage.getString(CACHE_KEY_ALBUMS);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (error) {
    console.error("Error reading albums meta from MMKV:", error);
    return null;
  }
}

// Escrita no cache
export async function saveAlbumsMeta(
  data: Omit<AlbumWithDetails, "coverArt" | "songs">[],
): Promise<void> {
  try {
    const cacheData: CachedAlbumData = {
      data: data,
      ts: Date.now(),
    };
    storage.set(CACHE_KEY_ALBUMS, JSON.stringify(cacheData));
    console.log("✅ Albums meta saved to MMKV");
  } catch (error) {
    console.error("Error saving albums meta to MMKV:", error);
  }
}

// Limpar cache
export async function clearAlbumsCache(): Promise<void> {
  try {
    storage.remove(CACHE_KEY_ALBUMS);
    console.log("✅ Albums cache cleared");
  } catch (error) {
    console.error("Error clearing albums cache:", error);
  }
}

// Verificar se cache expirou
export function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

export async function persistAlbumsMeta(
  albums: AlbumWithDetails[],
): Promise<void> {
  try {
    const light = albums.map(({ coverArt: _, songs: __, ...rest }) => rest);
    const cacheData = {
      data: light,
      ts: Date.now(),
    };
    storage.set(CACHE_KEY_ALBUMS, JSON.stringify(cacheData));
    console.log("✅ Albums meta saved to MMKV");
  } catch (error) {
    console.error("Error saving albums meta to MMKV:", error);
  }
}
// Obter estatísticas do cache
export function getCacheStats() {
  return {
    size: storage.byteSize,
    contains: storage.contains(CACHE_KEY_ALBUMS),
    memoryUsage: "N/A", // MMKV não expõe isso facilmente
  };
}
