import * as FileSystem from "expo-file-system/legacy";

export async function savePlaylistImage(
  playlistId: string,
  imageUri: string,
): Promise<string | null> {
  try {
    // Criar diretório se não existir
    const playlistDir = `${FileSystem.documentDirectory}playlist_covers/`;
    const dirInfo = await FileSystem.getInfoAsync(playlistDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(playlistDir, { intermediates: true });
    }

    // Gerar nome do arquivo
    const extension = imageUri.split(".").pop() || "jpg";
    const fileName = `${playlistId}_${Date.now()}.${extension}`;
    const filePath = `${playlistDir}${fileName}`;

    // Copiar imagem para o diretório da playlist
    await FileSystem.copyAsync({
      from: imageUri,
      to: filePath,
    });

    // Retornar o caminho local (URI)
    return filePath;
  } catch (error) {
    console.error("[savePlaylistImage] Erro ao salvar imagem:", error);
    return null;
  }
}

export async function deletePlaylistImage(
  imagePath: string | null | undefined,
) {
  if (!imagePath) return;

  try {
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imagePath);
    }
  } catch (error) {
    console.error("[deletePlaylistImage] Erro ao deletar imagem:", error);
  }
}
