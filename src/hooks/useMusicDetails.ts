import { useEffect, useState } from "react";
import { getTrackById } from "../modules/music-library.module";
import { fetchLyricsOnline } from "../services/lyrics.service";
import { TrackDetails } from "../types/interfaces";

export function useMusicDetails(musicId?: string) {
  const [musicDetails, setMusicDetails] = useState<TrackDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMusicDetails = async () => {
    if (!musicId) return;

    setLoading(true);
    setError(null);

    try {
      const track = await getTrackById(musicId);

      if (!track) {
        setError("Música não encontrada.");
        return;
      }

      let duration = track.duration;

      if (duration && typeof duration !== "number") {
        duration = parseInt(duration, 10);
      }

      if (duration && duration > 100000) {
        duration = Math.floor(duration / 1000);
      }

      let lyrics: string | undefined;

      if (track.title && track.artist) {
        lyrics = await fetchLyricsOnline(
          track.title,
          track.artist,
          track.album,
          duration,
        ).catch(() => undefined);
      }

      setMusicDetails({ ...track, lyrics });
    } catch {
      setError("Não foi possível carregar a música.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicDetails();
  }, [musicId]);

  return {
    musicDetails,
    loading,
    error,
    refetch: fetchMusicDetails,
  };
}
