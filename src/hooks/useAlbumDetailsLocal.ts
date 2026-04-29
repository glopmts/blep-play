import { setCachedAlbum } from "@/database/cache/albumDetailsCache";
import { getAlbumById } from "@/modules/music-library.module";
import { AlbumInterface } from "@/types/interfaces";
import { useEffect, useRef, useState } from "react";
import { getOrPersistCover } from "../database/cache/coverArtCache";

export function useAlbumDetailsLocal(albumId: string) {
  const [album, setAlbum] = useState<AlbumInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!albumId) return;
    abortRef.current = false;
    loadAlbum();
    return () => {
      abortRef.current = true;
    };
  }, [albumId]);

  async function loadAlbum() {
    setLoading(true);
    setError(null);

    try {
      const result = await getAlbumById(albumId);

      // Processa a capa do álbum
      let albumCoverPath: string | null = null;
      if (result && result.artworkBase64) {
        albumCoverPath = await getOrPersistCover(
          result.id,
          result.artworkBase64,
        );
        if (albumCoverPath) {
          result.artworkBase64 = albumCoverPath;
        }
      }

      // Propaga a capa do álbum para as músicas sem capa própria
      if (result?.songs) {
        for (const song of result.songs) {
          if (song.coverArt) {
            // Música tem capa própria — processa normalmente
            const songCoverPath = await getOrPersistCover(
              song.id,
              song.coverArt,
            );
            if (songCoverPath) song.coverArt = songCoverPath;
          } else if (albumCoverPath) {
            // Usa a capa do álbum como fallback
            song.coverArt = albumCoverPath;
          }
        }
      }

      setAlbum(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFromNative() {
    const result = await getAlbumById(albumId);
    if (abortRef.current) return;

    if (!result) {
      setError(new Error("Álbum não encontrado"));
      return;
    }

    setAlbum(result);
    setFromCache(false);
    setCachedAlbum(result).catch(console.error);
  }

  async function refreshInBackground() {
    try {
      const fresh = await getAlbumById(albumId);
      if (!fresh || abortRef.current) return;
      setAlbum(fresh);
      setCachedAlbum(fresh).catch(console.error);
    } catch {
      // falha silenciosa
    }
  }

  return { album, loading, fromCache, error };
}
