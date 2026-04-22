import * as FileSystem from "expo-file-system/legacy";
import { getPlaylistById } from "../services/playlists.service";
import { getSongCoverArt } from "./getSongCoverArt";

const COVERS_DIR = `${FileSystem.cacheDirectory}covers/`;

export async function ensureCoversDir() {
  const info = await FileSystem.getInfoAsync(COVERS_DIR);
  if (!info.exists)
    await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
}

export function getCoverPath(songId: string): string {
  const safe = songId.replace(/[^a-zA-Z0-9]/g, "_");
  return `${COVERS_DIR}${safe}.jpg`;
}

export async function hasCachedCover(albumId: string): Promise<boolean> {
  const path = getCoverPath(albumId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export async function saveCoverToFile(
  albumId: string,
  base64Data: string,
): Promise<string> {
  await ensureCoversDir();
  const path = getCoverPath(albumId);
  // Remove o prefixo data:image/jpeg;base64,
  const pureBase64 = base64Data.split(",")[1] ?? base64Data;
  await FileSystem.writeAsStringAsync(path, pureBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path; // retorna file:// path
}

export async function getCoverUri(
  albumId: string,
): Promise<string | undefined> {
  const path = getCoverPath(albumId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : undefined;
}

export async function clearCoversCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(COVERS_DIR);
  if (info.exists)
    await FileSystem.deleteAsync(COVERS_DIR, { idempotent: true });
}

export async function fetchAndCacheCover(
  songId: string, // ← chave única por música
  songUri: string,
): Promise<string | undefined> {
  const cached = await getCoverUri(songId);
  if (cached) return cached;

  const base64Cover = await getSongCoverArt(songUri);
  if (!base64Cover) return undefined;

  try {
    return await saveCoverToFile(songId, base64Cover);
  } catch {
    return base64Cover;
  }
}

export const getAllPlaylistImages = async (playlistId: string) => {
  const data = await getPlaylistById(playlistId);

  if (!data?.songs) return [];

  // Buscar imagens em paralelo para melhor performance
  const songsWithImages = await Promise.all(
    data.songs.map(async (song) => {
      const imageUri = await fetchAndCacheCover(song.id, song.uri);
      return {
        ...song,
        coverArt: imageUri, // Adiciona a imagem ao objeto da música
      };
    }),
  );

  return songsWithImages;
};
