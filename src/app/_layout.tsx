import * as Linking from "expo-linking";
import { useQuickAction } from "expo-quick-actions/hooks";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { NativeModules } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { BottomSheetProvider } from "../context/bottom-sheet-context";
import { LibrarySettingsProvider } from "../context/LibrarySettingsContext";
import { PlayerSetup } from "../context/player-context";
import { PlayerHeightProvider } from "../context/player-height-context";
import { ThemeProvider } from "../context/ThemeContext";
import "../css/global.css";
import { handleIncomingFile } from "../utils/fileHandler";

///NativeModules React
const { PerformanceOptimization, CacheManager } = NativeModules;

function RootLayoutNav() {
  const action = useQuickAction();

  useEffect(() => {
    if (!action) return;

    // Navegar para playlist
    if (action.id === "playlists") {
      router.push("/(main)/(tabs)/playlists" as any);
      return;
    }

    // Tocar música recente
    if (
      action.id.startsWith("recent_") &&
      action.params?.type === "recent_track"
    ) {
      router.push({
        pathname: "/player",
        params: {
          uri: encodeURIComponent(action.params.trackUrl as string),
          fileName: encodeURIComponent(action.params.trackTitle as string),
        },
      });
    }
  }, [action]);

  ///processUrl audios links
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

  // useEffect(() => {
  //   const recents = musicStorageSync.getRecents().slice(0, 2);

  //   const recentItems = recents.map((track, index) => ({
  //     title: track.title,
  //     subtitle: track.artist ?? "Artista desconhecido",
  //     icon: Platform.select({
  //       ios: "symbol:music.note",
  //       android: track.artwork || "list_music_icon",
  //     }),
  //     id: `recent_${index}`,
  //     params: {
  //       type: "recent_track",
  //       trackUrl: track.url,
  //       trackTitle: track.title,
  //       trackArtist: track.artist ?? "",
  //     },
  //   }));

  //   QuickActions.setItems([
  //     {
  //       title: "Playlists",
  //       icon: Platform.select({
  //         ios: "symbol:music.note.list",
  //         android: "list_music_icon",
  //       }),
  //       id: "playlists",
  //       params: { href: "/(main)/(tabs)/playlists" },
  //     },
  //     ...recentItems,
  //   ]);
  // }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_bottom",
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#27272a" }}>
      <ThemeProvider>
        <KeyboardProvider>
          <BottomSheetProvider>
            <LibrarySettingsProvider>
              <PlayerHeightProvider>
                <PlayerSetup>
                  <RootLayoutNav />
                </PlayerSetup>
              </PlayerHeightProvider>
            </LibrarySettingsProvider>
          </BottomSheetProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
