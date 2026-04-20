import * as FileSystem from "expo-file-system/legacy";

export async function handleIncomingFile(url: string): Promise<{
  uri: string;
  fileName: string;
}> {
  if (url.startsWith("content://")) {
    const fileName = extractFileNameFromContentUri(url);
    const cacheDir = FileSystem.cacheDirectory ?? "file:///data/user/0/cache/";
    const destUri = cacheDir + fileName;

    await FileSystem.copyAsync({ from: url, to: destUri });
    return { uri: destUri, fileName };
  }

  // iOS: file:// URI — acesso direto, sem copiar
  if (url.startsWith("file://")) {
    const fileName = url.split("/").pop() ?? "audio";
    return { uri: url, fileName };
  }

  // http/https: faz download com a nova API
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const fileName =
      url.split("/").pop()?.split("?")[0] ?? `audio_${Date.now()}.mp3`;

    const cacheDir = FileSystem.cacheDirectory ?? "file:///data/user/0/cache/";
    const destUri = cacheDir + fileName;

    const downloadResult = await FileSystem.downloadAsync(url, destUri);

    if (downloadResult.status !== 200) {
      throw new Error(`Download falhou com status ${downloadResult.status}`);
    }

    return { uri: downloadResult.uri, fileName };
  }

  throw new Error("URI não suportada: " + url);
}

function extractFileNameFromContentUri(uri: string): string {
  const parts = uri.split("/");
  const last = parts[parts.length - 1];
  // Remove query params se houver
  const clean = last?.split("?")[0] ?? "";
  if (clean && clean.includes(".")) return decodeURIComponent(clean);
  return `audio_${Date.now()}.mp3`;
}
