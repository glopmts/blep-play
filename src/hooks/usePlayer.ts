import { SongWithArt } from "@/types/interfaces";
import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer, {
  Event,
  RepeatMode,
  State,
  Track,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from "react-native-track-player";
import { addToRecents } from "../services/music-history.service";
import { updatePlayerWidget } from "../services/widget.service";
import { fetchAndCacheCover } from "../utils/coverArtCache";
import { getSongMetadata } from "../utils/getSongMetadata";

// ─── Converte SongWithArt → Track

function sanitizeArtwork(artwork: string | undefined): string | undefined {
  if (!artwork) return undefined;
  if (artwork.startsWith("file://") || artwork.startsWith("http"))
    return artwork;
  if (artwork.startsWith("/")) return `file://${artwork}`;
  if (artwork.startsWith("data:image")) return artwork; // ← base64
  return undefined;
}

function songToTrack(song: SongWithArt): Track {
  return {
    id: song.id,
    url: song.uri,
    title: song.filename?.replace(/\.[^/.]+$/, "") ?? "Música",
    artist: song.artist ?? "Artista desconhecido",
    album: song.albumName ?? "",
    artwork: sanitizeArtwork(song.coverArt),
    duration: song.duration,
  };
}

// ─── Hook principal
export function usePlayer() {
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress(500);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);
  const [isShuffle, setIsShuffle] = useState(false);
  const isLoadingRef = useRef(false);

  const isPlaying = playbackState.state === State.Playing;
  const isBuffering =
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;

  // Sincroniza o estado do player ao montar o hook
  useEffect(() => {
    let mounted = true;

    const syncCurrentTrack = async () => {
      try {
        const track = await TrackPlayer.getActiveTrack();
        const idx = await TrackPlayer.getActiveTrackIndex();
        const queueState = await TrackPlayer.getQueue();
        const pbState = await TrackPlayer.getPlaybackState();

        if (!mounted) return;

        if (track) {
          setCurrentTrack(track);
          setCurrentIndex(idx ?? 0);
          setQueue(queueState);
          updatePlayerWidget({
            artist: track.artist ?? "",
            title: track.title ?? "",
            isPlaying: pbState.state === State.Playing,
          });
        } else {
          setCurrentTrack(null);
        }
      } catch (error) {
        console.warn("[usePlayer] erro ao sincronizar faixa ativa:", error);
      }
    };

    syncCurrentTrack();

    return () => {
      mounted = false;
    };
  }, []);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (!event.track) return;

    // Aguarda o TrackPlayer confirmar a nova faixa ativa
    await new Promise((r) => setTimeout(r, 100));

    const idx = await TrackPlayer.getActiveTrackIndex();
    const track = await TrackPlayer.getActiveTrack();
    if (!track) return;

    let artwork = sanitizeArtwork(track.artwork as string);

    // Se não tem artwork válida, busca do cache
    if (!artwork) {
      const songUri = String(track.url);
      const albumId = String(track.id);
      artwork = (await fetchAndCacheCover(albumId, songUri)) ?? undefined;

      if (idx != null && artwork) {
        await TrackPlayer.updateMetadataForTrack(idx, { artwork });
        await TrackPlayer.updateNowPlayingMetadata({
          title: track.title,
          artist: track.artist,
          artwork,
        });
      }
    }

    setCurrentTrack({ ...track, artwork });
    setCurrentIndex(idx ?? 0);

    updatePlayerWidget({
      artist: track.artist ?? "",
      title: track.title ?? "",
      isPlaying: true,
    });

    await addToRecents({
      id: String(track.id),
      url: String(track.url),
      title: String(track.title ?? ""),
      artist: track.artist as string | undefined,
      album: track.album as string | undefined,
      artwork,
      duration: track.duration,
    });
  });

  // ── Carregar faixa externa (deep link / notificação) ──

  const loadExternalTrack = useCallback(
    async (uri: string, fileName?: string) => {
      if (isLoadingRef.current) return;

      const activeTrack = await TrackPlayer.getActiveTrack();
      if (activeTrack?.url === uri) return;

      isLoadingRef.current = true;
      try {
        // Limpa o nome do arquivo para usar como título provisório
        const provisionalTitle = fileName
          ? decodeURIComponent(fileName).replace(/\.[^/.]+$/, "")
          : decodeURIComponent(uri.split("/").pop() ?? "Áudio").replace(
              /\.[^/.]+$/,
              "",
            );

        const decodedUri = decodeURIComponent(uri);

        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: `external_${Date.now()}`,
          url: decodedUri,
          title: provisionalTitle,
          artist: "Carregando...",
          artwork: undefined,
        });
        await TrackPlayer.play();

        const track = await TrackPlayer.getActiveTrack();
        setCurrentTrack(track ?? null);
        setCurrentIndex(0);
        setQueue(track ? [track] : []);

        // Busca metadados reais em background sem travar o play
        getSongMetadata(decodedUri).then(async (meta) => {
          const idx = await TrackPlayer.getActiveTrackIndex();
          if (idx == null) return;

          // artwork precisa ser file:// ou http:// — content:// não funciona na notificação
          const artwork = sanitizeArtwork(meta.coverArt);

          await TrackPlayer.updateMetadataForTrack(idx, {
            title: meta.title ?? provisionalTitle,
            artist: meta.artist ?? "Arquivo externo",
            album: meta.album,
            artwork,
          });

          await TrackPlayer.updateNowPlayingMetadata({
            title: meta.title ?? provisionalTitle,
            artist: meta.artist ?? "Arquivo externo",
            artwork: artwork,
          });

          setCurrentTrack((prev) =>
            prev
              ? {
                  ...prev,
                  title: meta.title ?? provisionalTitle,
                  artist: meta.artist ?? "Arquivo externo",
                  artwork,
                }
              : prev,
          );
        });
      } catch (err) {
        console.error("[loadExternalTrack] erro:", err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [],
  );

  // ── Carregar lista e tocar ───
  const playSongs = useCallback(
    async (songs: SongWithArt[], startIndex = 0) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        // Converte todas sem esperar o cache (rápido)
        const tracks = songs.map((song) => songToTrack(song));

        // Só converte a capa da faixa atual antes de tocar
        if (songs[startIndex]?.albumId) {
          tracks[startIndex].artwork = await fetchAndCacheCover(
            String(songs[startIndex].id), // ← era albumId, agora song.id
            songs[startIndex].uri,
          );
        }

        await TrackPlayer.reset();
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(startIndex);
        await TrackPlayer.play();

        setQueue(tracks);
        setCurrentIndex(startIndex);
        setCurrentTrack(tracks[startIndex]);

        updatePlayerWidget({
          artist: tracks[startIndex].artist ?? "",
          title: tracks[startIndex].title ?? "",
          isPlaying: true,
        });

        await TrackPlayer.updateNowPlayingMetadata({
          title: tracks[startIndex].title,
          artist: tracks[startIndex].artist,
          album: tracks[startIndex].album,
          artwork: tracks[startIndex].artwork,
        });

        // Converte as demais capas em background
        tracks.forEach(async (track, idx) => {
          if (idx === startIndex) return;
          const artwork = await fetchAndCacheCover(
            String(songs[idx].id), // ← song.id único por música
            songs[idx].uri,
          );
          if (artwork) {
            await TrackPlayer.updateMetadataForTrack(idx, { artwork });
            tracks[idx].artwork = artwork;
          }
        });
      } catch (error) {
        console.error("Erro ao tocar músicas:", error);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [],
  );

  // ── Controles──
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  }, [isPlaying]);

  const togglePlayStop = useCallback(async () => {
    if (isPlaying) await TrackPlayer.stop();
    else await TrackPlayer.play();
  }, [isPlaying]);

  const skipToNext = useCallback(async () => {
    await TrackPlayer.skipToNext();
  }, []);

  const skipToPrevious = useCallback(async () => {
    if (position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  }, [position]);

  const seekTo = useCallback(async (seconds: number) => {
    await TrackPlayer.seekTo(seconds);
  }, []);

  const toggleRepeat = useCallback(async () => {
    const next =
      repeatMode === RepeatMode.Off
        ? RepeatMode.Queue
        : repeatMode === RepeatMode.Queue
          ? RepeatMode.Track
          : RepeatMode.Off;
    await TrackPlayer.setRepeatMode(next);
    setRepeatMode(next);
  }, [repeatMode]);

  const toggleShuffle = useCallback(async () => {
    setIsShuffle((prev) => !prev);
    // Embaralha a fila mantendo a faixa atual
    const currentQ = await TrackPlayer.getQueue();
    const idx = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
    if (!isShuffle) {
      const rest = currentQ.filter((_, i) => i !== idx);
      const shuffled = rest.sort(() => Math.random() - 0.5);
      const current = currentQ[idx];
      await TrackPlayer.reset();
      await TrackPlayer.add([current, ...shuffled]);
      await TrackPlayer.skip(0);
    }
  }, [isShuffle]);

  return {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    position,
    duration,
    repeatMode,
    isShuffle,
    playSongs,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    togglePlayStop,
    toggleRepeat,
    toggleShuffle,
    loadExternalTrack,
  };
}
