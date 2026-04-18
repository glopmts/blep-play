import * as MediaLibrary from "expo-media-library";

export interface SongWithArt extends MediaLibrary.Asset {
  coverArt?: string; // Capa individual da música
  artist?: string; // Adicionar campo para artista
  genre?: string;
  albumName?: string;
  title?: string;
}

export interface AlbumWithDetails {
  id: string;
  title: string;
  assetCount: number;
  coverArt?: string | undefined;
  songs: SongWithArt[];
  artist?: string;
  year?: number;
}

export interface GroupedAlbum {
  id: string;
  title: string;
  artistName: string;
}

export interface GroupedAlbum extends AlbumWithDetails {
  artistName: string;
  albumName: string;
}
