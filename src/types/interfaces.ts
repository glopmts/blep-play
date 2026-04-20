import * as MediaLibrary from "expo-media-library";

export interface SongWithArt extends MediaLibrary.Asset {
  albumName?: string;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  track?: string;
  coverArt?: string;
  lyrics?: string;
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
