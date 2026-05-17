import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { TrackDetails } from "../types/interfaces";

const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

export function useVideoClip() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVideoClip = useCallback(async (track: TrackDetails) => {
    const cacheKey = `video_clip:${track.url}`;

    // 1. Tenta cache primeiro
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      setVideoId(cached);
      return cached;
    }

    setIsLoading(true);
    try {
      const query =
        track.clipSearchQuery ??
        `${track.artist} ${track.title} official video clip`;

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=video&maxResults=1` +
          `&q=${encodeURIComponent(query)}` +
          `&key=${YOUTUBE_API_KEY}`,
      );
      const data = await res.json();
      const id: string = data.items?.[0]?.id?.videoId;

      if (!id) throw new Error("Nenhum clipe encontrado");

      // 4. Salva cache por 7 dias
      await AsyncStorage.setItem(cacheKey, id);
      setVideoId(id);
      return id;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (track: TrackDetails) => {
    await AsyncStorage.removeItem(`video_clip:${track.url}`);
  }, []);

  return { videoId, isLoading, error, searchVideoClip, clearCache };
}
