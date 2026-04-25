import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { NativeModules } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { BottomSheetProvider } from "../context/bottom-sheet-context";
import { PlayerSetup } from "../context/player-context";
import { PlayerHeightProvider } from "../context/player-height-context";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import "../css/global.css";
import { handleIncomingFile } from "../utils/fileHandler";
const { PerformanceOptimization, CacheManager } = NativeModules;

function RootLayoutNav() {
  const { colors } = useTheme();
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

  useEffect(() => {
    // Otimiza threads nativas
    PerformanceOptimization?.setThreadPriority();
    PerformanceOptimization?.optimizeForScrolling();

    // Configura cache
    CacheManager?.getCacheStats().then((stats: any) => {
      console.log("Cache stats:", stats);
    });
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade", // 'slide_from_right' | 'fade' | 'flip'
          animationDuration: 300,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#27272a" }}>
      <BottomSheetProvider>
        <ThemeProvider>
          <PlayerHeightProvider>
            <PlayerSetup>
              <RootLayoutNav />
            </PlayerSetup>
          </PlayerHeightProvider>
        </ThemeProvider>
      </BottomSheetProvider>
    </GestureHandlerRootView>
  );
}
