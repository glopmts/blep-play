import { requireNativeModule } from "expo-modules-core";
import { AlbumInterface, SongWithArt, TrackDetails } from "../types/interfaces";

const MusicLibrary = requireNativeModule("MusicLibrary");

export async function getAlbums(): Promise<AlbumInterface[]> {
  return MusicLibrary.getAlbums();
}

export async function getTracks(albumId: string): Promise<SongWithArt[]> {
  return MusicLibrary.getTracks(albumId);
}

export async function getAlbumCover(filePath: string): Promise<string | null> {
  return MusicLibrary.getAlbumCover(filePath);
}

export async function getAllTracksLocal() {
  return MusicLibrary.getAllTracks();
}

export async function getTracksByFolders(
  folderPaths: string[],
): Promise<TrackDetails[]> {
  if (!folderPaths || folderPaths.length === 0) {
    return MusicLibrary.getAllTracks();
  }

  const results = await Promise.all(
    folderPaths.map((path) => MusicLibrary.getTracksByFolder(path)),
  );

  const seen = new Set<string>();
  return results.flat().filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);

    return true;
  });
}

export async function getMusicFolders() {
  return MusicLibrary.getMusicFolders();
}

export async function getTrackById(
  trackId: string,
): Promise<TrackDetails | null> {
  return MusicLibrary.getTrackById(trackId);
}

export async function getAlbumById(
  albumId: string,
): Promise<AlbumInterface | null> {
  return MusicLibrary.getAlbumById(albumId);
}
