import TrackPlayer, { Event } from "react-native-track-player";

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext(),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );

  // 🔑 destroy() impede restauração — stop()+reset() mantém o player vivo
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    await TrackPlayer.seekTo(position);
  });
};
