import {
  clearAllCovers,
  getCoverUri,
  getOrPersistCover,
} from "@/database/cache/coverArtCache";
import { musicCache } from "@/database/music-cache";
import { getTracksByFolders } from "@/modules/music-library.module";
import { TrackDetails } from "@/types/interfaces";
import { useCallback, useEffect, useRef, useState } from "react";
import { dbClearAllAlbums } from "../../database/albumsCache";

const COVER_BATCH_SIZE = 10;

// Recebe as pastas ativas como parâmetro
export function useMusics(activeFolderPaths: string[] | null) {
  const [musics, setMusics] = useState<TrackDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeFolderPathsRef = useRef<string[]>(activeFolderPaths);
  const foldersKey =
    activeFolderPaths === null ? "__pending__" : activeFolderPaths.join("|");

  const mountedRef = useRef(true);
  const musicsRef = useRef<TrackDetails[]>([]);

  useEffect(() => {
    activeFolderPathsRef.current = activeFolderPaths;
  }, [activeFolderPaths]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistCoversInBackground = useCallback(
    async (tracks: TrackDetails[]) => {
      for (let i = 0; i < tracks.length; i += COVER_BATCH_SIZE) {
        if (!mountedRef.current) return;

        const batch = tracks.slice(i, i + COVER_BATCH_SIZE);
        const resolved = await Promise.all(
          batch.map(async (track) => {
            let uri = await getCoverUri(track.id);
            if (!uri && track.coverArt) {
              uri = await getOrPersistCover(track.id, track.coverArt);
            }
            return { id: track.id, uri: uri ? toFileUri(uri) : null };
          }),
        );

        if (!mountedRef.current) return;

        setMusics((prev) => {
          const next = [...prev];
          for (const { id, uri } of resolved) {
            const idx = next.findIndex((t) => t.id === id);
            if (idx !== -1 && uri && next[idx].coverArt !== uri) {
              next[idx] = { ...next[idx], coverArt: uri };
            }
          }
          musicsRef.current = next;
          return next;
        });

        await sleep(32);
      }
    },
    [],
  );

  const loadAllTracks = useCallback(async () => {
    if (!mountedRef.current) return;
    if (activeFolderPathsRef.current === null) return;
    setLoading(true);
    setError(null);

    try {
      // Chave estável representando as pastas ativas
      const currentKey = activeFolderPathsRef.current.slice().sort().join("|");

      const cached = await musicCache.getAllCachedTracks();
      const savedKey = await musicCache.getFolderKey();

      //  Cache só é aproveitado se foi gerado com as mesmas pastas
      const isSameContext = savedKey === currentKey;
      const hasCachedData =
        isSameContext && Array.isArray(cached) && cached.length > 0;

      if (hasCachedData && mountedRef.current) {
        musicsRef.current = cached;
        setMusics(cached);
        setLoading(false);
      }

      const fresh = await getTracksByFolders(activeFolderPathsRef.current);
      if (!mountedRef.current) return;

      const isDifferent =
        !hasCachedData ||
        fresh.length !== cached.length ||
        fresh[0]?.id !== cached[0]?.id ||
        fresh[fresh.length - 1]?.id !== cached[cached.length - 1]?.id;

      if (isDifferent) {
        if (!isSameContext) {
          await musicCache.clearCache();
          await dbClearAllAlbums();
          await clearAllCovers();
        }

        const withoutBase64 = fresh.map((t: TrackDetails) => ({
          ...t,
          coverArt: null,
        }));
        musicsRef.current = withoutBase64;
        setMusics(withoutBase64);

        musicCache.cacheMultipleTracks(withoutBase64).catch((err) => {
          console.warn("[useMusics] falha ao salvar cache:", err?.message);
        });
        musicCache.setFolderKey(currentKey).catch(() => {});
      }

      persistCoversInBackground(fresh);
    } catch (e: any) {
      const msg = e?.message ?? "Erro ao buscar músicas";
      console.error("[useMusics]", msg);
      if (mountedRef.current) setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [foldersKey, persistCoversInBackground]);

  useEffect(() => {
    loadAllTracks();
  }, [loadAllTracks]);

  const filterByFolder = useCallback(
    (path: string) =>
      musics.filter((t) => t.filePath.startsWith(path.trimEnd() + "/")),
    [musics],
  );

  const reload = useCallback(async () => {
    setLoadingRefresh(true);
    try {
      await loadAllTracks();
    } finally {
      setTimeout(() => {
        if (mountedRef.current) setLoadingRefresh(false);
      }, 300);
    }
  }, [loadAllTracks]);

  return { musics, loading, isRefresh, error, reload, filterByFolder };
}

function toFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
