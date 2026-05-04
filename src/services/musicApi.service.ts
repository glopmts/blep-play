import {
  Album,
  Artist,
  Lyrics,
  SearchResults,
  SongLinks,
  StreamInfo,
  Track,
} from "@/types/online-search";
import axios from "axios";

// Change this to your backend URL
const BASE_URL = __DEV__
  ? "http://192.168.18.11:3333/api/v1"
  : "https://your-production-api.com/api/v1";

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export const musicApi = {
  search: async (query: string, limit = 20): Promise<SearchResults> => {
    const { data } = await api.get("/search", { params: { q: query, limit } });
    return data;
  },

  getTrack: async (id: number): Promise<Track> => {
    const { data } = await api.get(`/tracks/${id}`);
    return data;
  },

  getStreamUrl: async (id: number): Promise<StreamInfo> => {
    const { data } = await api.get(`/tracks/${id}/stream`);
    return data;
  },

  // Use proxy endpoint to avoid CORS — returns redirect to stream
  getProxyStreamUrl: (id: number): string => {
    return `${BASE_URL}/tracks/${id}/proxy`;
  },

  getLyrics: async (id: number): Promise<Lyrics> => {
    const { data } = await api.get(`/tracks/${id}/lyrics`);
    return data;
  },

  getSongLinks: async (id: number): Promise<SongLinks> => {
    const { data } = await api.get(`/tracks/${id}/links`);
    return data;
  },

  getAlbum: async (id: number): Promise<{ album: Album; tracks: Track[] }> => {
    const { data } = await api.get(`/albums/${id}`);
    return data;
  },

  getArtist: async (
    id: number,
  ): Promise<{ artist: Artist; albums: Album[]; topTracks: Track[] }> => {
    const { data } = await api.get(`/artists/${id}`);
    return data;
  },
};
