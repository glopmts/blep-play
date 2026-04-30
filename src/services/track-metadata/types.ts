/**
 * Sistema unificado de metadados de faixas
 * Tipos e interfaces
 */

export interface TrackMetadata {
  id: string;
  filePath: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  cover?: string; // base64 ou file URI
  coverLoaded: boolean;
  extractedAt: number;
}

export interface CoverResult {
  cover: string | null;
  loading: boolean;
  error: string | null;
}

export interface MetadataStoreState {
  metadata: Map<string, TrackMetadata>;
  pendingExtractions: Set<string>;
  initialized: boolean;
}

export type CoverSize = 'thumbnail' | 'medium' | 'large';

export interface CoverOptions {
  size?: CoverSize;
  forceRefresh?: boolean;
}

// Tipos para diferentes entidades que usam covers
export type CoverEntityType = 'track' | 'album' | 'playlist' | 'artist' | 'history';

export interface CoverRequest {
  type: CoverEntityType;
  id: string;
  trackIds?: string[]; // Para playlist/album/artist - usa primeira faixa
  filePath?: string; // Para track individual
}
