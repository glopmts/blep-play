import * as FileSystem from "expo-file-system/legacy";
import {
  getEnrichedMetadata,
  parseDuration,
} from "../modules/process-url.module";

export interface IncomingFileResult {
  uri: string;
  fileName: string;
  artist?: string | null;
  album?: string | null;
  artworkUri?: string | null;
  duration?: number;
}

export async function handleIncomingFile(
  url: string,
): Promise<IncomingFileResult> {
  if (url.startsWith("content://")) {
    const fileName = extractFileNameFromContentUri(url);
    const cacheDir = FileSystem.cacheDirectory ?? "file:///data/user/0/cache/";
    const safeFileName = fileName.replace(/[\/\\:*?"<>|]/g, "_");
    const destUri = cacheDir + safeFileName;

    const info = await FileSystem.getInfoAsync(destUri);
    if (!info.exists) {
      await copyContentUri(url, destUri);
    }

    // Lê metadados da URI original (content://) — mais rica que o arquivo copiado
    const meta = await getEnrichedMetadata(url, fileName);

    return {
      uri: destUri,
      fileName: meta.title ?? fileName,
      artist: meta.artist,
      album: meta.album,
      artworkUri: meta.artworkUri,
      duration: parseDuration(meta.duration),
    };
  }

  if (url.startsWith("file://")) {
    const fileName = url.split("/").pop() ?? "audio";

    const meta = await getEnrichedMetadata(url, fileName);

    return {
      uri: url,
      fileName: meta.title ?? fileName,
      artist: meta.artist,
      album: meta.album,
      artworkUri: meta.artworkUri,
      duration: parseDuration(meta.duration),
    };
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const fileName =
      url.split("/").pop()?.split("?")[0] ?? `audio_${Date.now()}.mp3`;
    const cacheDir = FileSystem.cacheDirectory ?? "file:///data/user/0/cache/";
    const destUri = cacheDir + fileName;

    const downloadResult = await FileSystem.downloadAsync(url, destUri);
    if (downloadResult.status !== 200) {
      throw new Error(`Download falhou com status ${downloadResult.status}`);
    }

    // Para HTTP, lê do arquivo já baixado (URL remota não tem ContentResolver)
    const meta = await getEnrichedMetadata(downloadResult.uri, fileName);

    return {
      uri: downloadResult.uri,
      fileName: meta.title ?? fileName,
      artist: meta.artist,
      album: meta.album,
      artworkUri: meta.artworkUri,
      duration: parseDuration(meta.duration),
    };
  }

  throw new Error("URI não suportada: " + url);
}

// Tenta copyAsync, se falhar (SAF tree URI) usa downloadAsync como fallback
async function copyContentUri(from: string, to: string): Promise<void> {
  try {
    await FileSystem.copyAsync({ from, to });
  } catch (copyError) {
    // SAF tree URIs (externalstorage.documents) não são copiáveis diretamente
    // downloadAsync consegue ler via stream nativo
    try {
      const result = await FileSystem.downloadAsync(from, to);
      // downloadAsync com content:// retorna status 0 em caso de sucesso
      if (result.status !== 200 && result.status !== 0) {
        throw new Error(`Falha ao ler arquivo: status ${result.status}`);
      }
    } catch (downloadError) {
      // Lança o erro original que é mais descritivo
      throw copyError;
    }
  }
}

function extractFileNameFromContentUri(uri: string): string {
  let decoded = decodeURIComponent(uri);
  const afterSlash = decoded.split("/").pop() ?? "";
  const afterColon = afterSlash.split(":").pop() ?? afterSlash;
  const fileName = afterColon.split("/").pop() ?? afterColon;

  if (fileName && fileName.includes(".")) return fileName;
  return `audio_${Date.now()}.mp3`;
}
