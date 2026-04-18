import * as Notifications from "expo-notifications";
import React from "react";
import { Platform } from "react-native";

// Função para mostrar a notificação de mídia
export const useMediaNotification = (
  title: string,
  isPlaying: boolean,
  onPlayPause: () => void,
  onNext: () => void,
  onPrevious: () => void,
) => {
  const showMediaNotification = async () => {
    if (Platform.OS !== "android") return;

    // Cria um canal de notificação para mídia
    await Notifications.setNotificationChannelAsync("media-notification", {
      name: "Notificação de Mídia",
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
    });

    // Exibe a notificação de mídia
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: "Reproduzindo agora...",
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        // Usa a propriedade `data` para passar informações extras
        data: {
          mediaStyle: true,
          picture: "https://via.placeholder.com/150", // Substitua pelo ícone da música
        },
      },
      trigger: null,
    });
  };

  // Atualiza a notificação quando o estado muda
  React.useEffect(() => {
    showMediaNotification();
  }, [title, isPlaying]);

  // Lida com as ações da notificação
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const action = response.actionIdentifier;
        if (action === "PLAY_PAUSE") {
          onPlayPause();
        } else if (action === "NEXT") {
          onNext();
        } else if (action === "PREVIOUS") {
          onPrevious();
        }
      },
    );

    return () => subscription.remove();
  }, [onPlayPause, onNext, onPrevious]);
};
