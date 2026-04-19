import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export async function handleIncomingFile(
  uri: string,
): Promise<{ uri: string; fileName: string }> {
  try {
    let processedUri = uri;
    let fileName = "audio.mp3";

    // O cacheDirectory pode ser nulo em ambientes web ou falhas raras
    const cacheDir = FileSystem.Paths.cache;

    if (Platform.OS === "android" && uri.startsWith("content://")) {
      fileName = await getFileNameFromContentUri(uri);

      if (cacheDir) {
        const extension = fileName.split(".").pop() || "mp3";
        const tempUri = `${cacheDir}${Date.now()}.${extension}`;

        try {
          // A forma correta de copiar arquivos no Expo
          await FileSystem.copyAsync({
            from: uri,
            to: tempUri,
          });
          processedUri = tempUri;
        } catch (copyError) {
          console.warn("⚠️ Erro na cópia, usando original:", copyError);
        }
      }
    } else {
      const segments = uri.split("/");
      fileName = segments[segments.length - 1] || "audio.mp3";
    }

    return {
      uri: processedUri,
      fileName: decodeURIComponent(fileName),
    };
  } catch (error) {
    return { uri, fileName: `audio_${Date.now()}.mp3` };
  }
}
async function getFileNameFromContentUri(uri: string): Promise<string> {
  try {
    // Tenta extrair nome do arquivo da URI
    const decoded = decodeURIComponent(uri);

    // Procura por padrões comuns de nome de arquivo
    const patterns = [
      /[^/]+\.(mp3|m4a|wav|flac|aac|ogg)(?:\?|$)/i,
      /[^/]+(?:\?|$)/,
    ];

    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (match) {
        let name = match[0].split("?")[0];
        if (!name.includes(".")) {
          name += ".mp3";
        }
        return name;
      }
    }

    return `audio_${Date.now()}.mp3`;
  } catch {
    return `audio_${Date.now()}.mp3`;
  }
}
