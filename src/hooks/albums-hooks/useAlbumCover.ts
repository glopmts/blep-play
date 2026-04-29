import { getOrPersistCover } from "@/database/cache/coverArtCache";
import { useEffect, useState } from "react";

export function useAlbumCover(albumId: string, artworkBase64: string | null) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId || !artworkBase64) return;
    let cancelled = false;

    getOrPersistCover(albumId, artworkBase64).then((path) => {
      if (!cancelled) setUri(path);
    });

    return () => {
      cancelled = true;
    };
  }, [albumId, artworkBase64]);

  return uri;
}
