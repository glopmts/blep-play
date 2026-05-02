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
  const tempPath = `${COVERS_DIR}temp_${id}.jpg`;
  const finalPath = `${COVERS_DIR}${id}.jpg`;

  try {
    await ensureCoversDir();

    const cleanBase64 = base64
      .replace(/^data:image\/\w+;base64,/, "")
      .replace(/\s/g, "");

    if (!cleanBase64 || cleanBase64.length < 100) return null;

    await FileSystem.writeAsStringAsync(tempPath, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      const result = await manipulateAsync(
        `file://${tempPath}`,
        [{ resize: { width: 500 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      );

      const compressedBase64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(finalPath, compressedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch {
      // Compressão falhou — salva o original sem comprimir
      await FileSystem.copyAsync({ from: tempPath, to: finalPath });
    }

    return finalPath;
  } catch (error) {
    console.error("Error saving cover:", error);
    return null;
  } finally {
    // Sempre limpa o temp, mesmo em caso de erro
    await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(
      () => {},
    );
  }
}
