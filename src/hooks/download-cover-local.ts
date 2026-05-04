import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useState } from "react";
import { Platform } from "react-native";
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
      // Android 10+ (API 29+): não precisa de permissão para salvar na própria galeria
      const needsPermission =
        Platform.OS === "ios" ||
        (Platform.OS === "android" && (Platform.Version as number) < 29);

      if (needsPermission) {
        // Verifica primeiro — só pede se ainda não foi concedida
        const { status: existing } = await MediaLibrary.getPermissionsAsync();

        if (existing !== "granted") {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== "granted") {
            showPlatformMessage(
              "Permissão negada. Ative nas configurações do app.",
            );
            return;
          }
        }
      }

      const fileName = albumName
        ? `cover_${albumName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.jpg`
        : `cover_${Date.now()}.jpg`;

      const isFilePath =
        coverFile.startsWith("file://") || coverFile.startsWith("/");

      let assetUri: string;
      let tempPath: string | null = null;

      if (isFilePath) {
        assetUri = coverFile.startsWith("file://")
          ? coverFile
          : `file://${coverFile}`;
      } else {
        const cleanBase64 = coverFile
          .replace(/^data:image\/\w+;base64,/, "")
          .replace(/\s/g, "");

        if (!cleanBase64 || cleanBase64.length < 100) return;

        tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempPath, cleanBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        assetUri = tempPath;
      }

      const asset = await MediaLibrary.createAssetAsync(assetUri);

      try {
        const album = await MediaLibrary.getAlbumAsync("Covers");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("Covers", asset, false);
        }
      } catch {
        // Falha ao organizar em álbum não é crítica — asset já foi salvo
      }

      showPlatformMessage("Capa salva na galeria!");

      // Limpa temp somente se foi criado via base64
      if (tempPath) {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      }
    } catch (e: any) {
      console.error("[useDownloadCoverLocal] erro:", e?.message);
      showPlatformMessage("Erro ao salvar capa.");
    } finally {
      setDownload(false);
    }
  };

  return { isDownload, handleDownload };
}
