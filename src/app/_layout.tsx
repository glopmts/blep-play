import { PlaybackService } from "@/services/playback.service";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TrackPlayer from "react-native-track-player";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { ThemeProvider } from "../context/theme-app";
import "../css/global.css";
import { handleIncomingFile } from "../utils/fileHandler";

let isServiceRegistered = false;
if (!isServiceRegistered) {
  isServiceRegistered = true;
  TrackPlayer.registerPlaybackService(() => PlaybackService);
}

function RootLayoutNav() {
  const processUrl = useCallback(async (url: string) => {
    if (url.startsWith("exp+") || url.startsWith("exp://")) return;

    const { router } = require("expo-router");
    const parsed = Linking.parse(url);

    if (parsed.path === "player" || parsed.path === "player/notification") {
      router.push({ pathname: "/player" });
      return;
    }

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
    ({ url }: { url: string }) => {
      processUrl(url);
    },
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#27272a" }}>
      <ThemeProvider>
        <>
          <Stack screenOptions={{ headerShown: false }} />
        </>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
