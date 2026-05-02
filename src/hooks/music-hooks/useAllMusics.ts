import { useCallback, useEffect, useRef, useState } from "react";
import { getOrPersistCover } from "../../database/cache/coverArtCache";
import { musicCache } from "../../database/music-cache";
import { getAllTracksLocal } from "../../modules/music-library.module";
import { TrackDetails } from "../../types/interfaces";

const COVER_BATCH_SIZE = 10; // quantas capas processa por vez

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

  // ── Persiste capas em lotes e atualiza o estado incrementalmente
  const persistCoversInBackground = useCallback(
    async (tracks: TrackDetails[]) => {
      const withCover = tracks.filter((t) => t.coverArt);
      if (withCover.length === 0) return;

      for (let i = 0; i < withCover.length; i += COVER_BATCH_SIZE) {
        if (!mountedRef.current) return;

        const batch = withCover.slice(i, i + COVER_BATCH_SIZE);

        const resolved = await Promise.all(
          batch.map(async (track) => {
            const uri = await getOrPersistCover(track.id, track.filePath);
            return { id: track.id, uri };
          }),
        );

        if (!mountedRef.current) return;

        // Atualiza só as faixas do lote — sem re-render gigante
        setMusics((prev) => {
          const updated = [...prev];
          for (const { id, uri } of resolved) {
            const idx = updated.findIndex((t) => t.id === id);
            if (idx !== -1 && uri && updated[idx].coverArt !== uri) {
              updated[idx] = { ...updated[idx], coverArt: uri };
            }
          }
          musicsRef.current = updated;
          return updated;
        });

        // Pausa entre lotes para não monopolizar o event loop
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
      // ── 1. Cache imediato
      const cached = await musicCache.getAllCachedTracks();
      const hasCachedData = Array.isArray(cached) && cached.length > 0;

      if (hasCachedData && mountedRef.current) {
        musicsRef.current = cached;
        setMusics(cached);
        setLoading(false);
      }

      // ── 2. Busca fresca do nativo
      const fresh = await getAllTracksLocal();
      if (!mountedRef.current) return;

      // ── 3. Atualiza só se houver diferença
      const isDifferent =
        !hasCachedData ||
        fresh.length !== cached.length ||
        fresh[0]?.id !== cached[0]?.id ||
        fresh[fresh.length - 1]?.id !== cached[cached.length - 1]?.id;

      if (isDifferent) {
        // Exibe sem capas agora — o batch preenche em background
        const withoutCover = fresh.map((t: any) => ({ ...t, coverArt: null }));
        musicsRef.current = withoutCover;
        setMusics(withoutCover);

        // Salva metadados sem base64 para não inflar o DB
        musicCache.cacheMultipleTracks(withoutCover).catch((err) => {
          console.warn("[useMusics] falha ao salvar cache:", err?.message);
        });

        // Capas em background com base64 vindo do nativo
        persistCoversInBackground(fresh);
      }
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
      musics.filter((t) => t.filePath.startsWith(path.trimEnd("/") + "/")),
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

  return {
    musics,
    loading,
    isRefresh,
    error,
    reload,
    filterByFolder,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
