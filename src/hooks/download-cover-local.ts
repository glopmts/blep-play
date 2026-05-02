import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useState } from "react";
import { showPlatformMessage } from "../components/toast-message-plataform";

type PropsDownloadCover = {
  coverFile?: string | null;
  albumName?: string;
};

export function useDownloadCoverLocal() {
  const [isDownload, setDownload] = useState(false);

  const handleDownload = async ({
    coverFile,
    albumName,
  }: PropsDownloadCover) => {
    if (!coverFile || isDownload) return;
    setDownload(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;

      const fileName = albumName
        ? `cover_${albumName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.jpg`
        : `cover_${Date.now()}.jpg`;

      const isFilePath =
        coverFile.startsWith("file://") || coverFile.startsWith("/");

      let assetUri: string;

      if (isFilePath) {
        // Já é um arquivo — usa direto
        assetUri = coverFile.startsWith("file://")
          ? coverFile
          : `file://${coverFile}`;
      } else {
        // É base64 — escreve em temp primeiro
        const cleanBase64 = coverFile
          .replace(/^data:image\/\w+;base64,/, "")
          .replace(/\s/g, "");

        if (!cleanBase64 || cleanBase64.length < 100) return;

        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempPath, cleanBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        assetUri = tempPath;
      }

      // Salva na galeria
      const asset = await MediaLibrary.createAssetAsync(assetUri);

      try {
        const album = await MediaLibrary.getAlbumAsync("Covers");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("Covers", asset, false);
        }
        showPlatformMessage("Capa salva na galeria!");
      } catch {
        showPlatformMessage("Capa salva na galeria!");
      }

      // Limpa temp só se foi criado (caso base64)
      if (!isFilePath) {
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      }
    } catch (e: any) {
      console.error("[useDownloadCoverLocal] erro:", e?.message);
      showPlatformMessage("Erro ao salvar capa.");
    } finally {
      setDownload(false);
    }
  };

  return {
    isDownload,
    handleDownload,
  };
}
