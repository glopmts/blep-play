import { PlaybackService } from "@/services/playback.service";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TrackPlayer from "react-native-track-player";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { PlayerSetup } from "../context/player-context";
import "../css/global.css";

import { PlayerHeightProvider } from "../context/player-height-context";
import { handleIncomingFile } from "../utils/fileHandler";

function RootLayoutNav() {
  const processUrl = useCallback(async (url: string) => {
    // Ignora apenas deep links internos do Expo
    if (url.startsWith("exp+") || url.startsWith("exp://")) return;

    // content:// e file:// vão direto para o handler
    const isMediaFile =
      url.startsWith("content://") ||
      url.startsWith("file://") ||
      /\.(mp3|m4a|flac|wav|ogg|aac|opus)(\?|$)/i.test(url);

    const { router } = require("expo-router");
    const parsed = Linking.parse(url);

    if (
      !isMediaFile &&
      (parsed.path === "player" || parsed.path === "player/notification")
    ) {
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#27272a" }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    TrackPlayer.registerPlaybackService(() => PlaybackService); // ← aqui
  }, []);

  return (
    <PlayerHeightProvider>
      <PlayerSetup>
        <RootLayoutNav />
      </PlayerSetup>
    </PlayerHeightProvider>
  );
}
