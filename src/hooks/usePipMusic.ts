import ExpoPip from "expo-pip";
import { useEffect, useState } from "react";
import { usePlayer } from "./usePlayer";

export function usePipMusic() {
  const { isInPipMode } = ExpoPip.useIsInPip();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
  } = usePlayer();
  const [autoEnter, setAutoEnter] = useState(false);

  const buildActions = (playing: boolean) => [
    {
      iconName: "skip_previous",
      action: "action-previous",
      title: "Anterior",
      description: "Faixa anterior",
    },
    {
      iconName: playing ? "pause" : "play",
      action: "action-play-pause",
      title: playing ? "Pausar" : "Tocar",
      description: "Play/Pause",
    },
    {
      iconName: "skip_next",
      action: "action-next",
      title: "Próxima",
      description: "Próxima faixa",
    },
  ];

  //  Atualiza o ícone sempre que isPlaying mudar (dentro ou fora do PiP)
  useEffect(() => {
    if (!currentTrack) return;

    ExpoPip.setPictureInPictureParams({
      width: 200,
      height: 100,
      title: currentTrack.title ?? "Tocando agora",
      subtitle: currentTrack.artist ?? "",
      actions: buildActions(isPlaying),
    });
  }, [isPlaying, currentTrack]);

  const handlePip = () => {
    if (isInPipMode || !currentTrack) return;

    ExpoPip.enterPipMode({
      width: 200,
      height: 100,
      title: currentTrack.title ?? "Tocando agora",
      subtitle: currentTrack.artist ?? "",
      seamlessResizeEnabled: false,
      autoEnterEnabled: autoEnter,
      actions: buildActions(isPlaying),
    });
  };

  useEffect(() => {
    const sub = ExpoPip.addEventListener("onPipActionPressed", ({ action }) => {
      switch (action) {
        case "action-play-pause":
          togglePlayPause();
          break;
        case "action-next":
          skipToNext();
          break;
        case "action-previous":
          skipToPrevious();
          break;
      }
    });

    return () => sub.remove();
  }, [togglePlayPause, skipToNext, skipToPrevious]);

  return { handlePip, isInPipMode, autoEnter, setAutoEnter };
}
