import * as MediaLibrary from "expo-media-library";

export interface SongWithArt extends MediaLibrary.Asset {
  id: string;
  title: string;
  artist: string;
  trackNumber?: number;
  duration: number;
  filePath?: string;
  uri: string;
  mimeType?: string;
  year: string;
  lyrics?: string;
  genre?: string;
  bitrate?: number;
  fileSize?: number;
}

export interface TrackDetails {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId: string;
  trackNumber: number;
  duration: number; // milissegundos
  filePath: string;
  uri: string;
  mimeType: string;
  year: number;
  bitrate: number;
  fileSize: number;
  composer: string | null;
  coverArt?: string | null; // file:// path (após cache) ou null
  lyrics?: string;
}

export interface AlbumWithDetails {
  id: string;
  title: string;
  assetCount: number;
  coverArt?: string | null;
  songs: TrackDetails[];
  artist?: string;
  year?: number;
}

export interface AlbumInterface {
  id: string;
  album: string; //name ou title album
  artist: string;
  numberOfSongs: number;
  year: number;
  artworkBase64: string | null;
  // lista só existe quando carregado via getAlbumById
  songs?: TrackDetails[];
  // campos legados — podem remover depois
  artworkPath?: string | null;
  artworkUri?: string | null;
}

export interface GroupedAlbum {
  id: string;
  title: string;
  artistName: string;
}

export interface Playlists {
  id: string;
  musicId?: string;
  coverArt?: string | null;
  customCoverArt?: string | null;
  title: string;
  songs: TrackDetails[];
  playedAt?: number; // timestamp — só em recentes
}
