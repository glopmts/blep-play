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
