import { StoredTrack } from "../services/music-history.service";
import { TrackDetails } from "../types/interfaces";

export function storedTrackToSong(track: StoredTrack): TrackDetails {
  return {
    id: track.id,
    uri: track.url,
    filePath: track.url,
    title: track.title,
    artist: track.artist ?? "Artista desconhecido",
    album: track.album ?? "",
    albumId: track.albumId ?? "",
    trackNumber: 0,
    duration: track.duration ?? 0,
    mimeType: "",
    year: 0,
    bitrate: 0,
    fileSize: 0,
    composer: null,
    // file:// ou undefined — nunca base64
    coverArt: track.artwork,
  };
}

export function storedTracksToSongs(tracks: StoredTrack[]): TrackDetails[] {
  return tracks.map(storedTrackToSong);
}
