import {
  getCachedAlbumsList,
  setCachedAlbumsList,
} from "@/database/cache/albuns-local-cache";
import { getAlbums } from "@/modules/music-library.module";
import { AlbumInterface } from "@/types/interfaces";
import { usePermissions } from "expo-media-library";
import { useEffect, useRef, useState } from "react";

// useAlbums.ts
export function useAlbums() {
  const [albums, setAlbums] = useState<AlbumInterface[]>([]);
  const [loading, setLoading] = useState(true); // começa true
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = usePermissions();
  const abortRef = useRef(false);
  const hasLoadedOnce = useRef(false);

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
      const cached = await getCachedAlbumsList();
      if (cached && cached.length > 0 && !abortRef.current) {
        setAlbums(cached);
        hasLoadedOnce.current = true;
        setLoading(false);
        syncInBackground();
        return;
      }
      await fetchFromNative();
      hasLoadedOnce.current = true;
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
    setCachedAlbumsList(fresh).catch(console.error);
  }

  async function syncInBackground() {
    try {
      const fresh = await getAlbums();
      if (abortRef.current) return;

      setAlbums((prev) => {
        // Comparação mais robusta
        const changed =
          prev.length !== fresh.length ||
          fresh.some((f, i) => f.id !== prev[i]?.id);

        if (changed) {
          setCachedAlbumsList(fresh).catch(console.error);
          return fresh;
        }
        return prev;
      });
    } catch {
      // falha silenciosa
    }
  }

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
