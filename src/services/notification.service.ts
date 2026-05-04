import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert(
      "Erro",
      "Notificações não funcionam no emulador. Teste em dispositivo físico.",
    );
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("update_channel", {
      name: "Atualizações do App",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#A6FF4D",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permissão negada",
      "Permita notificações para receber alertas de atualização.",
    );
    return null;
  }

  // ✅ Sem getExpoPushTokenAsync() — não usa FCM, não precisa de Firebase
  return "local-notifications-ready";
}

export async function enableNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === "granted") {
    // Já tem permissão — garante o canal Android e retorna
    await ensureAndroidChannel();
    return true;
  }

  // Ainda não pediu — abre diálogo do sistema
  const { status } = await Notifications.requestPermissionsAsync();

  if (status === "granted") {
    await ensureAndroidChannel();
    return true;
  }

  // Usuário negou — direciona para configurações do sistema
  Alert.alert(
    "Notificações desativadas",
    "Para receber alertas, ative as notificações nas configurações do dispositivo.",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Abrir configurações",
        onPress: () => Linking.openSettings(),
      },
    ],
  );

  return false;
}

export async function disableNotifications(): Promise<void> {
  // 1. Cancela todas as notificações agendadas/pendentes
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Limpa notificações já exibidas na bandeja
  await Notifications.dismissAllNotificationsAsync();

  // 3. Zera o badge do ícone
  await Notifications.setBadgeCountAsync(0);

  // 4. Informa que a permissão precisa ser revogada manualmente pelo usuário
  //    (iOS/Android não permitem revogar permissão via código — apenas o usuário pode)
  Alert.alert(
    "Notificações desativadas no app",
    "Para desativar completamente as notificações do sistema, acesse as configurações do dispositivo.",
    [
      { text: "Ok" },
      {
        text: "Abrir configurações",
        onPress: () => Linking.openSettings(),
      },
    ],
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("update_channel", {
      name: "Atualizações do App",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#A6FF4D",
    });
  }
}
