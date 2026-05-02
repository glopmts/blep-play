import { compressAndSaveCover } from "@/services/cover-compression.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const MEM_CACHE_MAX = 600;
const memCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

async function dbGetString(id: string): Promise<string | undefined> {
  try {
    const value = await AsyncStorage.getItem(`cover_${id}`);
    return value === "null" ? undefined : value || undefined;
  } catch {
    return undefined;
  }
}

async function dbSetString(id: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`cover_${id}`, value);
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
}

export async function dbRemoveCacheCover(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`cover_${id}`);
  } catch (error) {
    console.error("Error removing from cache:", error);
  }
}

async function dbClearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const coverKeys = keys.filter((key) => key.startsWith("cover_"));
    await AsyncStorage.multiRemove(coverKeys);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

export async function getCoverUri(id: string): Promise<string | null> {
  // 1. Memória
  if (memCache.has(id)) {
    const val = memCache.get(id)!;
    if (val) {
      // Valida se o arquivo ainda existe
      const info = await FileSystem.getInfoAsync(val.replace("file://", ""));
      if (info.exists) {
        memCache.delete(id);
        memCache.set(id, val);
        return val;
      }
      // Arquivo sumiu — limpa memória e banco
      memCache.delete(id);
      await dbRemoveCacheCover(id);
    } else {
      return null;
    }
  }

  // 2. AsyncStorage
  const dbVal = await dbGetString(id);
  if (dbVal !== undefined) {
    const cleanPath = dbVal.replace("file://", "");
    const info = await FileSystem.getInfoAsync(cleanPath);
    if (info.exists) {
      memCache.set(id, dbVal);
      return dbVal;
    }
    // Arquivo sumiu — invalida entrada e retorna null para forçar re-persist
    await dbRemoveCacheCover(id);
    return null;
  }

  // 3. Disco (fallback direto)
  const path = `${FileSystem.cacheDirectory}covers/${id}.jpg`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    memCache.set(id, path);
    await dbSetString(id, path);
    return path;
  }

  return null;
}

export async function persistCover(
  id: string,
  base64: string,
): Promise<string | null> {
  if (inflight.has(id)) return inflight.get(id)!;

  const promise = (async (): Promise<string | null> => {
    try {
      const cleanBase64 = base64
        .replace(/^data:image\/\w+;base64,/, "")
        .replace(/\s/g, "");

      if (!cleanBase64 || cleanBase64.length < 100) return null;

      const path = await compressAndSaveCover(id, cleanBase64);
      if (path) {
        memCache.set(id, path);
        await dbSetString(id, path);
        return path;
      }
      return null;
    } catch (e) {
      console.error("[coversCacheManager] persistCover:", e);
      memCache.set(id, null);
      return null;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, promise);
  return promise;
}

export async function getOrPersistCover(
  id: string,
  base64: string | null | undefined,
): Promise<string | null> {
  if (!base64) return null;

  // Verifica cache primeiro
  const cached = await getCoverUri(id);

  if (cached) {
    return cached.startsWith("file://") ? cached : `file://${cached}`;
  }

  // Se não tem cache, processa
  const path = await persistCover(id, base64);

  if (!path) return null;

  return path.startsWith("file://") ? path : `file://${path}`;
}

export async function invalidateCover(id: string): Promise<void> {
  memCache.delete(id);
  await dbRemoveCacheCover(id);
  const path = `${FileSystem.cacheDirectory}covers/${id}.jpg`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
}

export async function clearAllCovers(): Promise<void> {
  memCache.clear();
  inflight.clear();
  await dbClearAll();
  const coversDir = `${FileSystem.cacheDirectory}covers/`;
  const info = await FileSystem.getInfoAsync(coversDir);
  if (info.exists)
    await FileSystem.deleteAsync(coversDir, { idempotent: true });
}
