import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const COVERS_DIR = `${FileSystem.cacheDirectory}covers/`;

async function ensureCoversDir() {
  const dirInfo = await FileSystem.getInfoAsync(COVERS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
  }
}

export async function compressAndSaveCover(
  id: string,
  base64: string,
): Promise<string | null> {
  try {
    await ensureCoversDir();

    const tempPath = `${COVERS_DIR}temp_${id}.jpg`;
    const finalPath = `${COVERS_DIR}${id}.jpg`;

    // Salva base64 temporário
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      // Tenta comprimir
      const result = await manipulateAsync(
        tempPath,
        [{ resize: { width: 500 } }], // Redimensiona para 500px de largura
        {
          compress: 0.7,
          format: SaveFormat.JPEG,
        },
      );

      // Move o arquivo comprimido para o destino final
      const compressedBase64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(finalPath, compressedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (compressError) {
      // Se falhar compressão, usa o original
      console.log("Compression failed, using original");
      await FileSystem.copyAsync({ from: tempPath, to: finalPath });
    }

    // Limpa temporário
    await FileSystem.deleteAsync(tempPath, { idempotent: true });

    return finalPath;
  } catch (error) {
    console.error("Error saving cover:", error);
    return null;
  }
}
