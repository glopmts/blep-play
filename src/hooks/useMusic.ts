import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";
import { fetchLyricsOnline } from "../services/lyrics.service";
import { SongWithArt } from "../types/interfaces";
import { getSongMetadata } from "../utils/getSongMetadata";

const CACHE_KEY_COVERS = "covers_map_v1";

const memoryCovers = new Map<string, string>();

async function readCoverCache(): Promise<void> {
  if (memoryCovers.size > 0) return;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_COVERS);
    if (raw) {
      const obj: Record<string, string> = JSON.parse(raw);
      Object.entries(obj).forEach(([k, v]) => memoryCovers.set(k, v));
    }
  } catch {}
}

export function useMusic({ musicId }: { musicId: string }) {
  const [musicDetails, setMusicDetails] = useState<SongWithArt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!musicId) return;
    fetchMusicDetails();
  }, [musicId]);

  const fetchMusicDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      await readCoverCache();

      const asset = await MediaLibrary.getAssetInfoAsync(musicId, {
        shouldDownloadFromNetwork: false, // não tenta baixar da nuvem
      });

      const meta = await getSongMetadata(asset.localUri ?? asset.uri);

      if (!asset || asset.mediaType !== "audio") {
        setError("Música não encontrada.");
        return;
      }
      const title =
        meta.title ?? asset.filename?.replace(/\.[^/.]+$/, "") ?? "";
      const artist = meta.artist ?? "Artista desconhecido";

      let lyrics = meta.lyrics;
      if (!lyrics && title && artist !== "Artista desconhecido") {
        lyrics = await fetchLyricsOnline(
          title,
          artist,
          meta.album,
          asset.duration,
        );
      }

      setMusicDetails({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        mediaType: asset.mediaType,
        width: asset.width,
        lyrics,
        height: asset.height,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        coverArt: meta.coverArt,
        title: meta.title ?? asset.filename?.replace(/\.[^/.]+$/, ""),
        artist: meta.artist ?? "Artista desconhecido",
        album: meta.album ?? "",
        genre: meta.genre ?? "",
        year: meta.year ?? "",
        track: meta.track ?? "",
        duration: asset.duration,
      });
    } catch (err) {
      console.error("Erro ao buscar música:", err);
      setError("Não foi possível carregar a música.");
    } finally {
      setLoading(false);
    }
  };

  return {
    musicDetails,
    loading,
    error,
    refetch: fetchMusicDetails,
  };
}
