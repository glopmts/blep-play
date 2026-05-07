/**
 * Hook para acessar metadados de faixas de forma reativa
 */

import type {
  CoverOptions,
  CoverResult,
  TrackMetadata,
} from "@/services/track-metadata";
import { TrackMetadataService } from "@/services/track-metadata";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Hook para obter metadados completos de uma faixa
 */
export function useTrackMetadata(
  trackId: string | undefined,
  filePath?: string,
): TrackMetadata | null {
  const subscribe = useCallback(
    (callback: () => void) => TrackMetadataService.subscribe(callback),
    [],
  );

  const getSnapshot = useCallback(() => {
    if (!trackId) return null;
    return TrackMetadataService.getMetadata(trackId, filePath);
  }, [trackId, filePath]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook para obter apenas o cover de uma faixa
 */
export function useCover(
  trackId: string | undefined,
  filePath?: string,
  options?: CoverOptions,
): CoverResult {
  const [state, setState] = useState<CoverResult>({
    cover: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!trackId) {
      setState({ cover: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadCover = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const cover = await TrackMetadataService.getCover(
          trackId,
          filePath,
          options,
        );

        if (!cancelled) {
          setState({ cover, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            cover: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    };

    loadCover();

    // Subscrever para atualizações
    const unsubscribe = TrackMetadataService.subscribe(() => {
      if (!cancelled) {
        const metadata = TrackMetadataService.getMetadata(trackId);
        if (metadata?.cover) {
          setState({ cover: metadata.cover, loading: false, error: null });
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [trackId, filePath, options?.forceRefresh]);

  return state;
}

/**
 * Hook para obter cover de uma playlist
 */
export function usePlaylistCover(
  playlistId: string | undefined,
  trackIds: string[],
  getFilePath: (trackId: string) => string | undefined,
): CoverResult {
  const [state, setState] = useState<CoverResult>({
    cover: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!playlistId || trackIds.length === 0) {
      setState({ cover: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadCover = async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const cover = await TrackMetadataService.getCoverForPlaylist(
          playlistId,
          trackIds,
          getFilePath,
        );

        if (!cancelled) {
          setState({ cover, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            cover: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    };

    loadCover();

    return () => {
      cancelled = true;
    };
  }, [playlistId, trackIds.join(",")]);

  return state;
}

/**
 * Hook para obter cover de um álbum
 */
export function useAlbumCover(
  albumId: string | undefined,
  trackIds: string[],
  getFilePath: (trackId: string) => string | undefined,
): CoverResult {
  const [state, setState] = useState<CoverResult>({
    cover: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!albumId || trackIds.length === 0) {
      setState({ cover: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadCover = async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const cover = await TrackMetadataService.getCoverForAlbum(
          albumId,
          trackIds,
          getFilePath,
        );

        if (!cancelled) {
          setState({ cover, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            cover: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    };

    loadCover();

    return () => {
      cancelled = true;
    };
  }, [albumId, trackIds.join(",")]);

  return state;
}

/**
 * Hook para obter múltiplos covers de uma vez
 */
export function useCovers(
  requests: Array<{ trackId: string; filePath?: string }>,
): Map<string, CoverResult> {
  const [results, setResults] = useState<Map<string, CoverResult>>(new Map());

  useEffect(() => {
    if (requests.length === 0) {
      setResults(new Map());
      return;
    }

    let cancelled = false;

    const loadCovers = async () => {
      // Inicializar todos como loading
      const initial = new Map<string, CoverResult>();
      requests.forEach(({ trackId }) => {
        initial.set(trackId, { cover: null, loading: true, error: null });
      });
      setResults(initial);

      // Carregar todos
      const covers = await TrackMetadataService.getCovers(requests);

      if (!cancelled) {
        const final = new Map<string, CoverResult>();
        covers.forEach((cover, trackId) => {
          final.set(trackId, { cover, loading: false, error: null });
        });
        setResults(final);
      }
    };

    loadCovers();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(requests)]);

  return results;
}

/**
 * Hook para pré-carregar metadados
 */
export function usePrefetchMetadata(
  tracks: Array<{ id: string; filePath: string }>,
): void {
  useEffect(() => {
    if (tracks.length > 0) {
      TrackMetadataService.prefetch(tracks);
    }
  }, [JSON.stringify(tracks.map((t) => t.id))]);
}
