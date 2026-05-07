import { getTrackById } from "@/modules/music-library.module";
import { TrackDetails } from "@/types/interfaces";
import { getLyricsForTrack } from "@/utils/song-metadata/getLyricsForTrack";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useMusicDetails(musicId?: string) {
  const [musicDetails, setMusicDetails] = useState<TrackDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
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

      // Normaliza duration para segundos
      let duration = track.duration;
      if (duration && typeof duration !== "number")
        duration = parseInt(duration, 10);
      if (duration && duration > 100_000)
        duration = Math.floor(duration / 1000);

      // Verifica conexão antes de chamar
      const netState = await NetInfo.fetch();
      const isConnected = !!netState.isConnected;

      const lyrics = await getLyricsForTrack({
        trackId: track.id,
        filePath: track.filePath,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration,
        online: isConnected,
      });

      setMusicDetails({ ...track, lyrics });
    } catch (err) {
      setError("Não foi possível carregar a música.");
      console.error(err);
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
    loadingLyrics,
    refetch: fetchMusicDetails,
  };
}
