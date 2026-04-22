import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { showPlatformMessage } from "../components/toast-message-plataform";
import { handleIncomingFile } from "../utils/fileHandler";

const AUDIO_EXTENSIONS = /\.(mp3|m4a|flac|wav|ogg|aac|opus)(\?|$)/i;

function isMediaUrl(url: string): boolean {
  return (
    url.startsWith("content://") ||
    url.startsWith("file://") ||
    AUDIO_EXTENSIONS.test(url)
  );
}

export default function NotFoundScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const tryHandleAsMedia = async () => {
      // Pega a URL original que causou o "not found"
      const url = await Linking.getInitialURL();

      if (url && isMediaUrl(url)) {
        try {
          const { uri, fileName } = await handleIncomingFile(url);
          router.replace({
            pathname: "/player",
            params: {
              uri: encodeURIComponent(uri),
              fileName: encodeURIComponent(fileName),
            },
          });
        } catch (error) {
          console.error("❌ Erro ao processar arquivo:", error);
          showPlatformMessage("❌ Formato de arquivo não suportado");
          router.replace("/");
        }
      } else {
        // Não é mídia, vai para home
        router.replace("/");
      }
    };

    tryHandleAsMedia();
  }, []);

  // Tela de loading enquanto processa
  return (
    <>
      <View className="flex-1 items-center justify-center gap-10 dark:bg-zinc-900">
        <Image
          source={require("../../assets/images/icon.png")}
          className="w-20 h-20 object-cover rounded-md"
          style={{
            width: 150,
            height: 150,
          }}
        />
        <ActivityIndicator size={36} color={isDark ? "#ffff" : "#3b82f6 "} />
      </View>
    </>
  );
}
