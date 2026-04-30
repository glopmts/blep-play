import {
  getCachedAlbum,
  isCachedAlbumFresh,
  setCachedAlbum,
} from "@/database/cache/albumDetailsCache";
import { getOrPersistCover } from "@/database/cache/coverArtCache";
import { getAlbumById } from "@/modules/music-library.module";
import { AlbumInterface, TrackDetails } from "@/types/interfaces";
import { useEffect, useRef, useState } from "react";

export function useAlbumDetailsLocal(albumId: string) {
  const [album, setAlbum] = useState<AlbumInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!albumId) return;
    abortRef.current = false;
    load();
    return () => {
      abortRef.current = true;
    };
  }, [albumId]);

  // ── Fluxo principal

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const cached = await getCachedAlbum(albumId);

      if (cached) {
        // Exibe cache imediatamente
        const hydrated = await hydrateCovers(cached);
        if (abortRef.current) return;
        setAlbum(hydrated);
        setFromCache(true);
        setLoading(false);

        // Se o cache está velho, atualiza em background
        const fresh = await isCachedAlbumFresh(albumId);
        if (!fresh) refreshInBackground();

        return;
      }

      // Sem cache: busca na fonte nativa
      await fetchFromNative();
    } catch (err) {
      if (!abortRef.current) setError(err as Error);
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }

  // ── Busca na fonte nativa

  async function fetchFromNative() {
    const result = await getAlbumById(albumId);
    if (abortRef.current) return;

    if (!result) {
      setError(new Error("Álbum não encontrado"));
      return;
    }

    const hydrated = await hydrateCovers(result);
    if (abortRef.current) return;

    setAlbum(hydrated);
    setFromCache(false);
    setCachedAlbum(hydrated).catch(console.error);
  }

  // ── Atualização silenciosa em background

  async function refreshInBackground() {
    try {
      const fresh = await getAlbumById(albumId);
      if (!fresh || abortRef.current) return;

      const hydrated = await hydrateCovers(fresh);
      if (abortRef.current) return;

      setAlbum(hydrated);
      setFromCache(false);
      setCachedAlbum(hydrated).catch(console.error);
    } catch {
      // Falha silenciosa — cache ainda está sendo exibido
    }
  }

  // ── Hidratação de capas

  async function hydrateCovers(raw: AlbumInterface): Promise<AlbumInterface> {
    // Capa do álbum
    let albumCoverPath: string | null = null;
    if (raw.artworkBase64) {
      albumCoverPath = await getOrPersistCover(raw.id, raw.artworkBase64);
    }

    const album: AlbumInterface = {
      ...raw,
      artworkBase64: albumCoverPath ?? raw.artworkBase64 ?? null,
    };

    // Capas das faixas em paralelo
    if (album.songs?.length) {
      album.songs = await Promise.all(
        album.songs.map(async (song: TrackDetails) => {
          if (song.coverArt) {
            const path = await getOrPersistCover(song.id, song.coverArt);
            return { ...song, coverArt: path ?? song.coverArt };
          }
          return albumCoverPath ? { ...song, coverArt: albumCoverPath } : song;
        }),
      );
    }

    return album;
  }

  return { album, loading, fromCache, error };
}
