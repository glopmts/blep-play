/**
 * Sistema de cache de covers em 3 camadas
 * Memória → AsyncStorage → Disco (extração)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "cover_v2_";
const MAX_MEMORY_CACHE = 100;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Cache em memória (LRU simples)
const memoryCache = new Map<string, { data: string; timestamp: number }>();
const accessOrder: string[] = [];

function updateAccessOrder(key: string) {
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);

  // Evict oldest if over limit
  while (accessOrder.length > MAX_MEMORY_CACHE) {
    const oldest = accessOrder.shift();
    if (oldest) {
      memoryCache.delete(oldest);
    }
  }
}

export const coverCache = {
  /**
   * Obtém cover do cache (memória ou AsyncStorage)
   */
  async get(trackId: string): Promise<string | null> {
    // 1. Tentar memória primeiro
    const memoryCached = memoryCache.get(trackId);
    if (memoryCached) {
      const isExpired = Date.now() - memoryCached.timestamp > CACHE_TTL;
      if (!isExpired) {
        updateAccessOrder(trackId);
        return memoryCached.data;
      }
      memoryCache.delete(trackId);
    }

    // 2. Tentar AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(`${CACHE_PREFIX}${trackId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
        if (!isExpired) {
          // Promover para memória
          memoryCache.set(trackId, parsed);
          updateAccessOrder(trackId);
          return parsed.data;
        }
        // Limpar expirado
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${trackId}`);
      }
    } catch (error) {
      console.warn("[CoverCache] Erro ao ler AsyncStorage:", error);
    }

    return null;
  },

  /**
   * Salva cover no cache (memória + AsyncStorage)
   */
  async set(trackId: string, coverData: string): Promise<void> {
    const entry = {
      data: coverData,
      timestamp: Date.now(),
    };

    // 1. Salvar em memória
    memoryCache.set(trackId, entry);
    updateAccessOrder(trackId);

    // 2. Salvar em AsyncStorage (async, não bloqueia)
    try {
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${trackId}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn("[CoverCache] Erro ao salvar AsyncStorage:", error);
    }
  },

  /**
   * Remove cover do cache
   */
  async remove(trackId: string): Promise<void> {
    memoryCache.delete(trackId);
    const index = accessOrder.indexOf(trackId);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${trackId}`);
    } catch (error) {
      console.warn("[CoverCache] Erro ao remover:", error);
    }
  },

  /**
   * Verifica se existe no cache (sem carregar)
   */
  has(trackId: string): boolean {
    return memoryCache.has(trackId);
  },

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    memoryCache.clear();
    accessOrder.length = 0;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const coverKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (coverKeys.length > 0) {
        await AsyncStorage.multiRemove(coverKeys);
      }
    } catch (error) {
      console.warn("[CoverCache] Erro ao limpar cache:", error);
    }
  },

  /**
   * Estatísticas do cache
   */
  getStats() {
    return {
      memorySize: memoryCache.size,
      maxMemorySize: MAX_MEMORY_CACHE,
      oldestKey: accessOrder[0] || null,
      newestKey: accessOrder[accessOrder.length - 1] || null,
    };
  },
};
