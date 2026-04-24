import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";
import ActivityIndicatorCustom from "../components/activityIndicator-Custom";
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
      <ActivityIndicatorCustom />
    </>
  );
}
