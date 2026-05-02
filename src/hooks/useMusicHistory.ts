import { useCallback, useEffect, useState } from "react";
import {
  StoredTrack,
  addToRecents,
  clearFavorites,
  clearRecents,
  getFavorites,
  getRecents,
  removeFromFavorites,
  removeFromRecents,
  toggleFavorite,
} from "../database/cache/music-history.cache";

export function useMusicHistory() {
  const [recents, setRecents] = useState<StoredTrack[]>([]);
  const [favorites, setFavorites] = useState<StoredTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [r, f] = await Promise.all([getRecents(), getFavorites()]);
    setRecents(r);
    setFavorites(f);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  };

  const handleAddToRecents = useCallback(async (track: StoredTrack) => {
    await addToRecents(track);
    setRecents(await getRecents());
  }, []);

  const handleToggleFavorite = useCallback(
    async (track: StoredTrack): Promise<boolean> => {
      const added = await toggleFavorite(track);
      setFavorites(await getFavorites());
      return added;
    },
    [],
  );

  const handleRemoveRecent = useCallback(async (trackId: string) => {
    await removeFromRecents(trackId);
    setRecents((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const handleRemoveFavorite = useCallback(async (trackId: string) => {
    await removeFromFavorites(trackId);
    setFavorites((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const handleClearRecents = useCallback(async () => {
    await clearRecents();
    setRecents([]);
  }, []);

  const handleClearFavorites = useCallback(async () => {
    await clearFavorites();
    setFavorites([]);
  }, []);

  const checkIsFavorite = useCallback(
    (trackId: string) => favorites.some((t) => t.id === trackId),
    [favorites],
  );

  return {
    recents,
    favorites,
    loading,
    addToRecents: handleAddToRecents,
    toggleFavorite: handleToggleFavorite,
    removeRecent: handleRemoveRecent,
    removeFavorite: handleRemoveFavorite,
    clearRecents: handleClearRecents,
    clearFavorites: handleClearFavorites,
    isFavorite: checkIsFavorite,
    reload: loadAll,
  };
}
