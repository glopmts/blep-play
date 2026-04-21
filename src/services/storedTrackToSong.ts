import { StoredTrack } from "../services/music-history.service";
import { SongWithArt } from "../types/interfaces";

export function storedTrackToSong(track: StoredTrack): SongWithArt {
  return {
    // Campos obrigatórios do MediaLibrary.Asset
    id: track.id,
    uri: track.url,
    filename: track.title ?? "",
    mediaType: "audio" as any,
    mediaSubtypes: [],
    width: 0,
    height: 0,
    creationTime: track.playedAt ?? track.addedAt ?? 0,
    modificationTime: track.playedAt ?? track.addedAt ?? 0,
    duration: track.duration ?? 0,
    albumId: undefined as any,
    // Campos extras do SongWithArt
    title: track.title,
    artist: track.artist,
    album: track.album,
    coverArt: track.artwork,
  };
}

export function storedTracksToSongs(tracks: StoredTrack[]): SongWithArt[] {
  return tracks.map(storedTrackToSong);
}
