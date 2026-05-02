import {
  getCachedAlbumsList,
  setCachedAlbumsList,
} from "@/database/cache/albuns-local-cache";
import { getAlbums } from "@/modules/music-library.module";
import { AlbumInterface } from "@/types/interfaces";
import { usePermissions } from "expo-media-library";
import { useEffect, useRef, useState } from "react";

export function useAlbums() {
  const [albums, setAlbums] = useState<AlbumInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = usePermissions();
  const abortRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    abortRef.current = false;
    load();
    return () => {
      abortRef.current = true;
    };
  }, [permission?.granted]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      // 1. Cache primeiro — exibe instantâneo
      const cached = await getCachedAlbumsList();
      if (cached && cached.length > 0 && !abortRef.current) {
        setAlbums(cached);
        setLoading(false);
        // Atualiza em background sem travar a UI
        syncInBackground();
        return;
      }

      // 2. Sem cache — busca do nativo (primeira vez)
      await fetchFromNative();
    } catch (e: any) {
      if (!abortRef.current) setError(e.message);
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }

  async function fetchFromNative() {
    const fresh = await getAlbums();
    if (abortRef.current) return;
    setAlbums(fresh);
    // Persiste sem bloquear
    setCachedAlbumsList(fresh).catch(console.error);
  }

  // Roda sem spinner — atualiza silenciosamente
  async function syncInBackground() {
    try {
      const fresh = await getAlbums();
      if (abortRef.current) return;

      // Só atualiza estado se algo mudou (evita re-render desnecessário)
      setAlbums((prev) => {
        if (prev.length !== fresh.length || prev[0]?.id !== fresh[0]?.id) {
          setCachedAlbumsList(fresh).catch(console.error);
          return fresh;
        }
        return prev;
      });
    } catch {
      // falha silenciosa — cache já está na tela
    }
  }

  // Pull-to-refresh manual
  async function refresh() {
    setRefreshing(true);
    try {
      await fetchFromNative();
    } finally {
      setRefreshing(false);
    }
  }

  return { albums, loading, refreshing, error, refresh };
}
