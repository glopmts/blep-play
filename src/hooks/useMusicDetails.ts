import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { getTrackById } from "../modules/music-library.module";
import { fetchLyricsOnline } from "../services/lyrics.service";
import { TrackDetails } from "../types/interfaces";
import { getLyricsForTrack } from "../utils/song-metadata/getLyricsForTrack";

export function useMusicDetails(musicId?: string) {
  const [musicDetails, setMusicDetails] = useState<TrackDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLyrics(
    trackId: string,
    filePath: string,
    title: string,
    artist: string,
    album: string,
    duration: number,
  ): Promise<string | undefined> {
    setLoadingLyrics(true);
    try {
      // 1. Sempre tenta local primeiro (cache SQLite → arquivo)
      const localLyrics = await getLyricsForTrack(trackId, filePath);
      if (localLyrics) return localLyrics;

      // 2. Só vai online se não encontrou localmente
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        showPlatformMessage("Sem conexão e letra não encontrada localmente.");
        return undefined;
      }

      const onlineLyrics = await fetchLyricsOnline(
        title,
        artist,
        album,
        duration,
      );
      return onlineLyrics;
    } catch (err) {
      showPlatformMessage("Erro ao buscar letra.");
      return undefined;
    } finally {
      setLoadingLyrics(false);
    }
  }

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
      if (duration && typeof duration !== "number")
        duration = parseInt(duration, 10);
      if (duration && duration > 100000) duration = Math.floor(duration / 1000);

      const lyrics = await fetchLyrics(
        track.id,
        track.filePath,
        track.title,
        track.artist,
        track.album,
        duration,
      );

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
