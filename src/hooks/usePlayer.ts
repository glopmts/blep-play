import { getOrPersistCover } from "@/database/cache/coverArtCache";
import { addToRecents, getRecents } from "@/database/cache/music-history.cache";
import { TrackDetails } from "@/types/interfaces";
import {
  sanitizeArtwork,
  songToTrack,
} from "@/utils/song-metadata/converte-songWithArt";
import { getSongMetadata } from "@/utils/song-metadata/getSongMetadata";
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

export function usePlayer() {
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress(500);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);
  const [isShuffle, setIsShuffle] = useState(false);
  const isLoadingRef = useRef(false);
  const isTogglingRef = useRef(false);

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
    async (songs: TrackDetails[], startIndex = 0) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        const tracks = songs.map((s) => songToTrack(s));

        const startSong = songs[startIndex];
        const startArtwork = startSong.coverArt
          ? await getOrPersistCover(startSong.id, startSong.coverArt)
          : null;

        if (startArtwork) tracks[startIndex].artwork = startArtwork;

        await TrackPlayer.reset();
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(startIndex);
        await TrackPlayer.play();

        setQueue(tracks);
        setCurrentIndex(startIndex);
        setCurrentTrack(tracks[startIndex]);

        await TrackPlayer.updateNowPlayingMetadata({
          title: tracks[startIndex].title,
          artist: tracks[startIndex].artist,
          album: tracks[startIndex].album,
          artwork: startArtwork ?? undefined,
        });
        await getRecents();
      } catch (error) {
        console.error("[playSongs] erro:", error);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [],
  );

  // Evento de troca de faixa — sempre busca file:// do cache
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (!event.track) return;

    await new Promise((r) => setTimeout(r, 100));

    const idx = await TrackPlayer.getActiveTrackIndex();
    const track = await TrackPlayer.getActiveTrack();
    if (!track) return;

    let artwork = sanitizeArtwork(track.artwork as string);

    if (!artwork) {
      const songId = String(track.id);
      const base64 = (track as any).coverArt as string | undefined;
      artwork = (await getOrPersistCover(songId, base64)) ?? undefined;

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

  // ── Controles──
  const togglePlayPause = useCallback(async () => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      const state = await TrackPlayer.getPlaybackState();
      const playing = state.state === State.Playing;

      if (playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } finally {
      isTogglingRef.current = false;
    }
  }, []);
  const togglePlayStop = useCallback(async () => {
    if (isPlaying) await TrackPlayer.play();
    else await TrackPlayer.stop();
  }, [isPlaying]);

  const stopAndClear = useCallback(async () => {
    await TrackPlayer.stop();
    await TrackPlayer.reset(); // Limpa toda a fila
    setCurrentTrack(null); // Limpa a faixa atual do estado
    setQueue([]); // Limpa a fila
    setCurrentIndex(0); // Reseta o índice
  }, []);

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
    stopAndClear,
    togglePlayStop,
    toggleRepeat,
    toggleShuffle,
    loadExternalTrack,
  };
}
