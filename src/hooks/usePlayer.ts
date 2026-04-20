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
import { updatePlayerWidget } from "../services/widget.service";
import { getSongMetadata } from "../utils/getSongMetadata";

// ─── Converte SongWithArt → Track
function songToTrack(song: SongWithArt): Track {
  return {
    id: song.id,
    url: song.uri,
    title: song.filename?.replace(/\.[^/.]+$/, "") ?? "Música",
    artist: song.artist ?? "Artista desconhecido",
    album: song.albumName ?? "",
    artwork: song.coverArt,
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

  // Atualiza a faixa atual
  useTrackPlayerEvents(
    [Event.PlaybackActiveTrackChanged, Event.PlaybackState],
    async () => {
      const track = await TrackPlayer.getActiveTrack();
      const pbState = await TrackPlayer.getPlaybackState();

      if (track) {
        // ← já existe, ok
        updatePlayerWidget({
          artist: track.artist ?? "",
          title: track.title ?? "",
          isPlaying: pbState.state === State.Playing,
        });
        setCurrentTrack(track);
      } else {
        setCurrentTrack(null);
        updatePlayerWidget({
          artist: "",
          title: "",
          isPlaying: false,
        });
      }
    },
  );

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    // event.track já é a faixa nova, sem latência de await
    if (event.track) {
      setCurrentTrack(event.track);
      const idx = await TrackPlayer.getActiveTrackIndex();
      setCurrentIndex(idx ?? 0);
    }
    // não faz nada se event.track for null/undefined
  });

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.index != null) {
      const track = await TrackPlayer.getActiveTrack();
      const idx = await TrackPlayer.getActiveTrackIndex();

      if (track) {
        // ← adiciona esse guard
        setCurrentTrack(track);
        setCurrentIndex(idx ?? 0);
      }
    }
  });

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
        getSongMetadata(decodedUri)
          .then(async (meta) => {
            const updatedTrack = {
              id: `external_${Date.now()}`,
              url: decodedUri,
              title: meta.title ?? provisionalTitle,
              artist: meta.artist ?? "Arquivo externo",
              album: meta.album,
              artwork: meta.coverArt,
            };

            // Atualiza a faixa na fila sem interromper a reprodução
            await TrackPlayer.updateNowPlayingMetadata({
              title: updatedTrack.title,
              artist: updatedTrack.artist,
              artwork: updatedTrack.artwork,
            });

            setCurrentTrack((prev) =>
              prev ? { ...prev, ...updatedTrack } : prev,
            );
          })
          .catch(() => {
            // Falhou em ler metadados — mantém o título provisório, tudo bem
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
      if (isLoadingRef.current) return; // 🔒 bloqueia cliques duplos
      isLoadingRef.current = true;

      try {
        const tracks = songs.map(songToTrack);
        await TrackPlayer.reset();
        await TrackPlayer.add(tracks);
        await TrackPlayer.skip(startIndex);
        await TrackPlayer.play();
        setQueue(tracks);
        setCurrentIndex(startIndex);
        setCurrentTrack(tracks[startIndex]);
      } finally {
        isLoadingRef.current = false; // 🔓 libera após concluir
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
