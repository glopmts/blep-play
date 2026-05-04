import { musicApi } from "@/services/musicApi.service";
import { PlayerStatus, Track } from "@/types/online-search";
import { Audio, AVPlaybackStatus } from "expo-av";
import { create } from "zustand";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  status: PlayerStatus;
  position: number;
  duration: number;
  volume: number;
  error: string | null;

  // Actions
  play: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  clearError: () => void;
}

let _sound: Audio.Sound | null = null;

async function releaseSound() {
  if (_sound) {
    try {
      await _sound.stopAsync();
      await _sound.unloadAsync();
    } catch {}
    _sound = null;
  }
}

// Resolve the best available stream URL, throwing typed errors on failure
async function resolveStreamUrl(trackId: number): Promise<string> {
  let streamInfo: { streamUrl?: string; code?: string } | null = null;

  try {
    streamInfo = await musicApi.getStreamUrl(trackId);
  } catch (err: any) {
    const code = err?.response?.data?.code as string | undefined;
    const httpStatus = err?.response?.status as number | undefined;

    if (code === "SUBSCRIPTION_REQUIRED" || httpStatus === 403) {
      const e = new Error("Faixa indisponível para esta assinatura");
      (e as any).code = "SUBSCRIPTION_REQUIRED";
      throw e;
    }

    if (code === "AUTH_EXPIRED" || httpStatus === 401) {
      const e = new Error("Sessão expirada — reconecte o hifi-api");
      (e as any).code = "AUTH_EXPIRED";
      throw e;
    }

    const e = new Error("Erro ao obter stream");
    (e as any).code = "STREAM_ERROR";
    throw e;
  }

  const url = streamInfo?.streamUrl;
  if (!url || url.trim() === "") {
    const e = new Error("URL de stream vazia ou inválida");
    (e as any).code = "EMPTY_URL";
    throw e;
  }

  return url;
}

function friendlyError(err: any): string {
  const code = (err as any)?.code as string | undefined;
  switch (code) {
    case "SUBSCRIPTION_REQUIRED":
      return "Faixa indisponível para esta assinatura Tidal";
    case "AUTH_EXPIRED":
      return "Sessão expirada — reinicie o hifi-api e faça login novamente";
    case "EMPTY_URL":
      return "Não foi possível obter o link de stream";
    default:
      return "Erro ao reproduzir a faixa";
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  status: "idle",
  position: 0,
  duration: 0,
  volume: 1,
  error: null,

  play: async (track: Track) => {
    set({ status: "loading", currentTrack: track, error: null });

    try {
      await releaseSound();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      // 1. Resolve stream URL first — throws on 401/403/empty
      const streamUrl = await resolveStreamUrl(track.id);

      // 2. Only create sound if we have a valid URL
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, volume: get().volume },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            // AVPlaybackStatus error — e.g. codec not supported or network drop
            if ((status as any).error) {
              console.error("[player] playback error:", (status as any).error);
              set({ status: "error", error: "Erro durante a reprodução" });
            }
            return;
          }

          set({
            position: (status.positionMillis ?? 0) / 1000,
            duration: (status.durationMillis ?? 0) / 1000,
            status: status.isPlaying ? "playing" : "paused",
          });

          if (status.didJustFinish) get().next();
        },
      );

      _sound = sound;
      set({ status: "playing", duration: track.duration, error: null });
    } catch (err: any) {
      console.error("[player] play error:", err?.message ?? err);
      await releaseSound();
      set({
        status: "error",
        error: friendlyError(err),
      });
    }
  },

  playQueue: async (tracks: Track[], startIndex = 0) => {
    if (!tracks.length) return;
    const safeIndex = Math.min(startIndex, tracks.length - 1);
    set({ queue: tracks, queueIndex: safeIndex });
    await get().play(tracks[safeIndex]);
  },

  pause: async () => {
    try {
      await _sound?.pauseAsync();
      set({ status: "paused" });
    } catch (err) {
      console.warn("[player] pause error:", err);
    }
  },

  resume: async () => {
    try {
      await _sound?.playAsync();
      set({ status: "playing" });
    } catch (err) {
      console.warn("[player] resume error:", err);
    }
  },

  togglePlay: async () => {
    const { status } = get();
    if (status === "playing") return get().pause();
    if (status === "paused") return get().resume();
  },

  seek: async (seconds: number) => {
    try {
      await _sound?.setPositionAsync(seconds * 1000);
      set({ position: seconds });
    } catch (err) {
      console.warn("[player] seek error:", err);
    }
  },

  next: async () => {
    const { queue, queueIndex } = get();
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      set({ queueIndex: nextIdx });
      await get().play(queue[nextIdx]);
    } else {
      set({ status: "idle", position: 0 });
    }
  },

  prev: async () => {
    const { queue, queueIndex, position } = get();
    if (position > 3) {
      await get().seek(0);
      return;
    }
    const prevIdx = Math.max(0, queueIndex - 1);
    set({ queueIndex: prevIdx });
    await get().play(queue[prevIdx]);
  },

  setVolume: async (vol: number) => {
    const clamped = Math.min(1, Math.max(0, vol));
    try {
      await _sound?.setVolumeAsync(clamped);
      set({ volume: clamped });
    } catch (err) {
      console.warn("[player] setVolume error:", err);
    }
  },

  clearError: () => set({ error: null }),
}));
