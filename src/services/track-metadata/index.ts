/**
 * Track Metadata Service
 * API pública unificada para gerenciamento de metadados de faixas
 *
 * Uso:
 * ```ts
 * import { TrackMetadataService } from '@/services/track-metadata';
 *
 * // Obter cover de uma faixa
 * const cover = await TrackMetadataService.getCover(trackId, filePath);
 *
 * // Obter cover para playlist (usa primeira faixa)
 * const playlistCover = await TrackMetadataService.getCoverForPlaylist(playlistId, trackIds, getFilePath);
 *
 * // Pré-carregar metadados
 * await TrackMetadataService.prefetch(tracks);
 * ```
 */

import { metadataStore } from "./metadata-store";
import { coverCache } from "./cover-cache";
import type {
  TrackMetadata,
  CoverOptions,
  CoverEntityType,
  CoverRequest,
} from "./types";

export const TrackMetadataService = {
  // --- Métodos de leitura ---

  /**
   * Obtém metadados completos de uma faixa
   */
  getMetadata(trackId: string, filePath?: string): TrackMetadata | null {
    return metadataStore.get(trackId, filePath);
  },

  /**
   * Obtém cover de uma faixa específica
   */
  async getCover(
    trackId: string,
    filePath?: string,
    options?: CoverOptions
  ): Promise<string | null> {
    return metadataStore.getCover(trackId, filePath, options);
  },

  /**
   * Obtém cover para uma playlist (usa primeira faixa com cover)
   */
  async getCoverForPlaylist(
    playlistId: string,
    trackIds: string[],
    getFilePath: (trackId: string) => string | undefined
  ): Promise<string | null> {
    return metadataStore.getCoverForEntity("playlist", trackIds, getFilePath);
  },

  /**
   * Obtém cover para um álbum
   */
  async getCoverForAlbum(
    albumId: string,
    trackIds: string[],
    getFilePath: (trackId: string) => string | undefined
  ): Promise<string | null> {
    return metadataStore.getCoverForEntity("album", trackIds, getFilePath);
  },

  /**
   * Obtém cover para um artista (usa primeira faixa)
   */
  async getCoverForArtist(
    artistName: string,
    trackIds: string[],
    getFilePath: (trackId: string) => string | undefined
  ): Promise<string | null> {
    return metadataStore.getCoverForEntity("artist", trackIds, getFilePath);
  },

  /**
   * Obtém cover para histórico de reprodução
   */
  async getCoverForHistory(
    trackIds: string[],
    getFilePath: (trackId: string) => string | undefined
  ): Promise<string | null> {
    return metadataStore.getCoverForEntity("history", trackIds, getFilePath);
  },

  /**
   * Obtém múltiplos covers de uma vez
   */
  async getCovers(
    requests: Array<{ trackId: string; filePath?: string }>
  ): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    await Promise.all(
      requests.map(async ({ trackId, filePath }) => {
        const cover = await metadataStore.getCover(trackId, filePath);
        results.set(trackId, cover);
      })
    );

    return results;
  },

  // --- Métodos de escrita ---

  /**
   * Pré-carrega metadados de várias faixas
   */
  async prefetch(
    tracks: Array<{ id: string; filePath: string }>
  ): Promise<void> {
    return metadataStore.prefetch(tracks);
  },

  /**
   * Define metadados manualmente
   */
  setMetadata(trackId: string, data: Partial<TrackMetadata>): void {
    metadataStore.set(trackId, data);
  },

  /**
   * Remove metadados de uma faixa
   */
  removeMetadata(trackId: string): void {
    metadataStore.remove(trackId);
  },

  // --- Métodos de cache ---

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    metadataStore.clear();
  },

  /**
   * Limpa apenas o cache de covers
   */
  async clearCoverCache(): Promise<void> {
    await coverCache.clear();
  },

  // --- Métodos de estado ---

  /**
   * Verifica se uma faixa está com extração pendente
   */
  isPending(trackId: string): boolean {
    return metadataStore.isPending(trackId);
  },

  /**
   * Verifica se o cover está no cache
   */
  hasCoverCached(trackId: string): boolean {
    return coverCache.has(trackId);
  },

  /**
   * Obtém estatísticas do sistema
   */
  getStats() {
    return metadataStore.getStats();
  },

  /**
   * Subscreve para mudanças no store
   */
  subscribe(listener: () => void): () => void {
    return metadataStore.subscribe(listener);
  },
};

// Re-exportar tipos
export type {
  TrackMetadata,
  CoverOptions,
  CoverEntityType,
  CoverRequest,
  CoverResult,
} from "./types";

// Export default
export default TrackMetadataService;
