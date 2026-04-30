import { useCallback, useState } from "react";
import { TrackDetails } from "../types/interfaces";
import { getTrackCoverSync } from "./useTrackCover";

export function usePlaylistCover() {
  const [coverCache, setCoverCache] = useState<Map<string, string>>(new Map());

  const getPlaylistCover = useCallback(
    async (songs: TrackDetails[]): Promise<string | null> => {
      if (songs.length === 0) return null;

      // A última música adicionada é a primeira do array (após reverse)
      const firstSong = songs[0];

      // Verifica se já tem no cache
      const cachedCover = coverCache.get(firstSong.id);
      if (cachedCover) return cachedCover;

      // Busca a capa
      const cover = await getTrackCoverSync(firstSong.filePath, firstSong.id);

      if (cover) {
        // Atualiza o cache
        setCoverCache((prev) => new Map(prev).set(firstSong.id, cover));
      }

      return cover || null;
    },
    [coverCache],
  );

  return { getPlaylistCover };
}
