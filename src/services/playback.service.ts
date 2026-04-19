import TrackPlayer, {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";

export const DefaultRepeatMode = RepeatMode.Queue;
export const DefaultAudioServiceBehaviour =
  AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification;

// ── Serviço de eventos remotos
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext(),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.permanent) await TrackPlayer.stop();
    else if (e.paused) await TrackPlayer.pause();
    else await TrackPlayer.play();
  });
}

// ── Setup único do player
export async function SetupService() {
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2,
      androidAudioContentType: AndroidAudioContentType.Music,
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.JumpBackward,
        Capability.JumpForward,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],

      android: {
        appKilledPlaybackBehavior: DefaultAudioServiceBehaviour,
      },
      progressUpdateEventInterval: 1,
    });

    await TrackPlayer.setRepeatMode(DefaultRepeatMode);
  } catch (e) {
    // Player já inicializado — ignora
    console.warn("[SetupService] já inicializado:", e);
  }
}
