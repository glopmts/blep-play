import { getCoverUri, getOrPersistCover } from "@/database/cache/coverArtCache";
import { musicCache } from "@/database/music-cache";
import { getAllTracksLocal } from "@/modules/music-library.module";
import { TrackDetails } from "@/types/interfaces";
import { useCallback, useEffect, useRef, useState } from "react";

const COVER_BATCH_SIZE = 10;

export function useMusics() {
  const [musics, setMusics] = useState<TrackDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const musicsRef = useRef<TrackDetails[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Persiste capas em lotes — atualiza APENAS coverArt, nunca filePath
  const persistCoversInBackground = useCallback(
    async (tracks: TrackDetails[]) => {
      for (let i = 0; i < tracks.length; i += COVER_BATCH_SIZE) {
        if (!mountedRef.current) return;

        const batch = tracks.slice(i, i + COVER_BATCH_SIZE);

        const resolved = await Promise.all(
          batch.map(async (track) => {
            // 1. Já existe em disco — retorna sem re-processar
            let uri = await getCoverUri(track.id);

            // 2. Ainda não tem → persiste o base64 do nativo
            if (!uri && track.coverArt) {
              uri = await getOrPersistCover(track.id, track.coverArt);
            }

            return {
              id: track.id,
              uri: uri ? toFileUri(uri) : null,
            };
          }),
        );

        if (!mountedRef.current) return;

        setMusics((prev) => {
          const next = [...prev];
          for (const { id, uri } of resolved) {
            const idx = next.findIndex((t) => t.id === id);
            // Toca SOMENTE em coverArt — filePath jamais é alterado aqui
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
    setLoading(true);
    setError(null);

    try {
      // 1. Cache imediato
      const cached = await musicCache.getAllCachedTracks();
      const hasCachedData = Array.isArray(cached) && cached.length > 0;

      if (hasCachedData && mountedRef.current) {
        musicsRef.current = cached;
        setMusics(cached);
        setLoading(false);
      }

      // 2. Fresco do nativo
      const fresh = await getAllTracksLocal();
      if (!mountedRef.current) return;

      const isDifferent =
        !hasCachedData ||
        fresh.length !== cached.length ||
        fresh[0]?.id !== cached[0]?.id ||
        fresh[fresh.length - 1]?.id !== cached[cached.length - 1]?.id;

      if (isDifferent) {
        // Exibe sem base64 no estado — base64 fica só no nativo até ser persistido
        const withoutBase64 = fresh.map((t: TrackDetails) => ({
          ...t,
          coverArt: null,
        }));
        musicsRef.current = withoutBase64;
        setMusics(withoutBase64);

        musicCache.cacheMultipleTracks(withoutBase64).catch((err) => {
          console.warn("[useMusics] falha ao salvar cache:", err?.message);
        });
      }

      // Sempre roda — mesmo sem isDifferent, capas podem estar prontas no disco
      persistCoversInBackground(fresh);
    } catch (e: any) {
      const msg = e?.message ?? "Erro ao buscar músicas";
      console.error("[useMusics]", msg);
      if (mountedRef.current) setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [persistCoversInBackground]);

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
