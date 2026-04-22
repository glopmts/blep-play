import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { PlayerSetup } from "../context/player-context";
import "../css/global.css";

import { BottomSheetProvider } from "../context/bottom-sheet-context";
import { PlayerHeightProvider } from "../context/player-height-context";
import { handleIncomingFile } from "../utils/fileHandler";

function RootLayoutNav() {
  const processUrl = useCallback(async (url: string) => {
    // Ignora deep links internos do Expo
    if (url.startsWith("exp+") || url.startsWith("exp://")) return;

    const isMediaFile =
      url.startsWith("content://") ||
      url.startsWith("file://") ||
      /\.(mp3|m4a|flac|wav|ogg|aac|opus)(\?|$)/i.test(url);

    // Se não for mídia, deixa o router resolver normalmente
    if (!isMediaFile) return;

    const { router } = require("expo-router");

    try {
      const { uri, fileName } = await handleIncomingFile(url);
      router.push({
        pathname: "/player",
        params: {
          uri: encodeURIComponent(uri),
          fileName: encodeURIComponent(fileName),
        },
      });
    } catch (error) {
      console.error("❌ Erro ao processar URL:", error);
      showPlatformMessage("❌ Erro ao processar URL");
    }
  }, []);

  const handleUrl = useCallback(
    ({ url }: { url: string }) => processUrl(url),
    [processUrl],
  );

  const handleInitialUrl = useCallback(async () => {
    const url = await Linking.getInitialURL();
    if (url) await processUrl(url);
  }, [processUrl]);

  useEffect(() => {
    handleInitialUrl();
    const subscription = Linking.addEventListener("url", handleUrl);
    return () => subscription.remove();
  }, [handleInitialUrl, handleUrl]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#27272a" }}>
      <PlayerHeightProvider>
        <PlayerSetup>
          <BottomSheetProvider>
            <RootLayoutNav />
          </BottomSheetProvider>
        </PlayerSetup>
      </PlayerHeightProvider>
    </GestureHandlerRootView>
  );
}
