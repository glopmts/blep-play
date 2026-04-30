/**
 * Store global de metadados de faixas
 * Singleton que gerencia extração e cache de metadados
 */

import { coverCache } from "./cover-cache";
import type { TrackMetadata, CoverOptions, CoverEntityType } from "./types";

// Substitua pelo seu módulo nativo real
// import GetAlbumsModule from "@/modules/get-albums";
const GetAlbumsModule = {
  async getMetadata(filePath: string): Promise<{
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    artwork?: string;
  } | null> {
    // Mock - substitua pela implementação real
    return null;
  },
};

type Listener = () => void;

class MetadataStore {
  private metadata = new Map<string, TrackMetadata>();
  private pendingExtractions = new Set<string>();
  private listeners = new Set<Listener>();
  private extractionQueue: string[] = [];
  private isProcessingQueue = false;
  private readonly BATCH_SIZE = 5;

  /**
   * Obtém metadados de uma faixa
   * Se não existir, inicia extração em background
   */
  get(trackId: string, filePath?: string): TrackMetadata | null {
    const existing = this.metadata.get(trackId);

    if (existing) {
      return existing;
    }

    // Se temos filePath e não está em extração, iniciar
    if (filePath && !this.pendingExtractions.has(trackId)) {
      this.queueExtraction(trackId, filePath);
    }

    return null;
  }

  /**
   * Obtém apenas o cover de uma faixa
   * Retorna do cache se disponível, senão inicia extração
   */
  async getCover(
    trackId: string,
    filePath?: string,
    options?: CoverOptions
  ): Promise<string | null> {
    // 1. Verificar se já temos em memória
    const existing = this.metadata.get(trackId);
    if (existing?.cover && !options?.forceRefresh) {
      return existing.cover;
    }

    // 2. Verificar cache persistido
    const cached = await coverCache.get(trackId);
    if (cached && !options?.forceRefresh) {
      // Atualizar metadata em memória
      if (existing) {
        existing.cover = cached;
        existing.coverLoaded = true;
      }
      return cached;
    }

    // 3. Se temos filePath, extrair
    if (filePath) {
      return this.extractCover(trackId, filePath);
    }

    return null;
  }

  /**
   * Obtém cover para uma entidade (album, playlist, etc.)
   * Usa a primeira faixa disponível
   */
  async getCoverForEntity(
    type: CoverEntityType,
    trackIds: string[],
    getFilePath: (trackId: string) => string | undefined
  ): Promise<string | null> {
    // Tentar cada track até encontrar um cover
    for (const trackId of trackIds) {
      const filePath = getFilePath(trackId);
      if (!filePath) continue;

      const cover = await this.getCover(trackId, filePath);
      if (cover) {
        return cover;
      }
    }
    return null;
  }

  /**
   * Pré-carrega metadados de várias faixas
   */
  async prefetch(
    tracks: Array<{ id: string; filePath: string }>
  ): Promise<void> {
    const toExtract = tracks.filter(
      (t) => !this.metadata.has(t.id) && !this.pendingExtractions.has(t.id)
    );

    for (const track of toExtract) {
      this.queueExtraction(track.id, track.filePath);
    }
  }

  /**
   * Define metadados manualmente (útil quando já temos os dados)
   */
  set(trackId: string, data: Partial<TrackMetadata>): void {
    const existing = this.metadata.get(trackId) || {
      id: trackId,
      filePath: "",
      coverLoaded: false,
      extractedAt: 0,
    };

    this.metadata.set(trackId, {
      ...existing,
      ...data,
      id: trackId,
    });

    // Se temos cover, salvar no cache
    if (data.cover) {
      coverCache.set(trackId, data.cover);
    }

    this.notifyListeners();
  }

  /**
   * Remove metadados de uma faixa
   */
  remove(trackId: string): void {
    this.metadata.delete(trackId);
    coverCache.remove(trackId);
    this.notifyListeners();
  }

  /**
   * Limpa todos os metadados
   */
  clear(): void {
    this.metadata.clear();
    this.pendingExtractions.clear();
    this.extractionQueue = [];
    coverCache.clear();
    this.notifyListeners();
  }

  /**
   * Verifica se uma faixa está com extração pendente
   */
  isPending(trackId: string): boolean {
    return this.pendingExtractions.has(trackId);
  }

  /**
   * Subscreve para mudanças no store
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Obtém estatísticas do store
   */
  getStats() {
    return {
      totalTracks: this.metadata.size,
      pendingExtractions: this.pendingExtractions.size,
      queueSize: this.extractionQueue.length,
      cacheStats: coverCache.getStats(),
    };
  }

  // --- Métodos privados ---

  private queueExtraction(trackId: string, filePath: string): void {
    if (this.pendingExtractions.has(trackId)) return;

    // Criar entry inicial
    this.metadata.set(trackId, {
      id: trackId,
      filePath,
      coverLoaded: false,
      extractedAt: 0,
    });

    this.pendingExtractions.add(trackId);
    this.extractionQueue.push(trackId);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.extractionQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.extractionQueue.length > 0) {
      // Processar em batches
      const batch = this.extractionQueue.splice(0, this.BATCH_SIZE);

      await Promise.all(
        batch.map(async (trackId) => {
          const meta = this.metadata.get(trackId);
          if (!meta?.filePath) {
            this.pendingExtractions.delete(trackId);
            return;
          }

          try {
            await this.extractMetadata(trackId, meta.filePath);
          } catch (error) {
            console.warn(`[MetadataStore] Erro ao extrair ${trackId}:`, error);
          }

          this.pendingExtractions.delete(trackId);
        })
      );

      this.notifyListeners();
    }

    this.isProcessingQueue = false;
  }

  private async extractMetadata(
    trackId: string,
    filePath: string
  ): Promise<void> {
    try {
      const result = await GetAlbumsModule.getMetadata(filePath);

      if (result) {
        const metadata: TrackMetadata = {
          id: trackId,
          filePath,
          title: result.title,
          artist: result.artist,
          album: result.album,
          duration: result.duration,
          cover: result.artwork || undefined,
          coverLoaded: !!result.artwork,
          extractedAt: Date.now(),
        };

        this.metadata.set(trackId, metadata);

        // Salvar cover no cache
        if (result.artwork) {
          await coverCache.set(trackId, result.artwork);
        }
      }
    } catch (error) {
      console.warn(`[MetadataStore] Falha ao extrair metadata:`, error);
    }
  }

  private async extractCover(
    trackId: string,
    filePath: string
  ): Promise<string | null> {
    try {
      const result = await GetAlbumsModule.getMetadata(filePath);

      if (result?.artwork) {
        // Atualizar metadata
        const existing = this.metadata.get(trackId);
        if (existing) {
          existing.cover = result.artwork;
          existing.coverLoaded = true;
        } else {
          this.metadata.set(trackId, {
            id: trackId,
            filePath,
            cover: result.artwork,
            coverLoaded: true,
            extractedAt: Date.now(),
          });
        }

        // Salvar no cache
        await coverCache.set(trackId, result.artwork);
        this.notifyListeners();

        return result.artwork;
      }
    } catch (error) {
      console.warn(`[MetadataStore] Falha ao extrair cover:`, error);
    }

    return null;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Singleton
export const metadataStore = new MetadataStore();
