import { AlbumInterface } from "@/types/interfaces";
import {
  dbGetAlbumDetails,
  dbIsAlbumDetailsFresh,
  dbRemoveAlbumDetails,
  dbSetAlbumDetails,
} from "../albums-details.cache";

/** 7 dias — álbum raramente muda */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function setCachedAlbum(album: AlbumInterface): Promise<void> {
  await dbSetAlbumDetails<AlbumInterface>(album.id, album);
}

export async function getCachedAlbum(
  albumId: string,
): Promise<AlbumInterface | null> {
  const entry = await dbGetAlbumDetails<AlbumInterface>(albumId);
  return entry?.data ?? null;
}

export async function isCachedAlbumFresh(albumId: string): Promise<boolean> {
  return dbIsAlbumDetailsFresh(albumId, MAX_AGE_MS);
}

export async function removeCachedAlbum(albumId: string): Promise<void> {
  await dbRemoveAlbumDetails(albumId);
}
