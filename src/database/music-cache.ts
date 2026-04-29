import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { TrackDetails } from "../types/interfaces";

let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Configurações do cache
const CACHE_CONFIG = {
  MAX_AGE_DAYS: 7, // Dias para manter no cache
  MAX_CACHE_SIZE_MB: 500, // Tamanho máximo do cache em MB
  CLEANUP_INTERVAL_HOURS: 24, // Limpeza automática a cada 24 horas
};

// Cache de capas
const COVER_CACHE_DIR = `${FileSystem.cacheDirectory}music_covers/`;

export interface CachedTrack extends TrackDetails {
  cachedAt?: number; // timestamp
  lastPlayed?: number; // timestamp
  playCount?: number;
  coverCached?: boolean;
}

export interface CacheStats {
  totalTracks: number;
  totalSize: number;
  oldestTrack: number;
  newestTrack: number;
  coverCacheSize: number;
}

export class MusicCache {
  private static instance: MusicCache;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MusicCache {
    if (!MusicCache.instance) {
      MusicCache.instance = new MusicCache();
    }
    return MusicCache.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!initPromise) {
      initPromise = this.initDatabase();
    }
    await initPromise;
    this.isInitialized = true;
  }

  private async initDatabase(): Promise<SQLite.SQLiteDatabase> {
    try {
      // Criar diretório para capas
      const coverDir = FileSystem.cacheDirectory + "music_covers/";
      const dirInfo = await FileSystem.getInfoAsync(coverDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(coverDir, { intermediates: true });
      }

      // Abrir banco de dados
      this.db = await SQLite.openDatabaseAsync("music_cache_v1.db");

      // Criar tabela de cache
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cached_tracks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT,
          album TEXT,
          albumId TEXT,
          trackNumber INTEGER,
          duration INTEGER,
          filePath TEXT NOT NULL,
          uri TEXT,
          mimeType TEXT,
          year INTEGER,
          bitrate INTEGER,
          fileSize INTEGER,
          composer TEXT,
          lyrics TEXT,
          cachedAt INTEGER NOT NULL,
          lastPlayed INTEGER NOT NULL,
          playCount INTEGER DEFAULT 0,
          coverCached INTEGER DEFAULT 0,
          coverPath TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_last_played ON cached_tracks(lastPlayed);
        CREATE INDEX IF NOT EXISTS idx_play_count ON cached_tracks(playCount);
        CREATE INDEX IF NOT EXISTS idx_cached_at ON cached_tracks(cachedAt);
        
        CREATE TABLE IF NOT EXISTS cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT,
          updatedAt INTEGER
        );
      `);

      // Configurar limpeza automática
      await this.setupAutoCleanup();

      return this.db;
    } catch (error) {
      console.error("Erro ao inicializar cache:", error);
      throw error;
    }
  }

  private async setupAutoCleanup(): Promise<void> {
    const lastCleanup = await this.getMetadata("last_cleanup");
    const now = Date.now();

    if (
      !lastCleanup ||
      now - parseInt(lastCleanup) >
        CACHE_CONFIG.CLEANUP_INTERVAL_HOURS * 3600000
    ) {
      await this.cleanupCache();
      await this.setMetadata("last_cleanup", now.toString());
    }
  }

  // Salvar música no cache
  async cacheTrack(track: TrackDetails): Promise<void> {
    await this.initialize();

    const now = Date.now();
    const statement = await this.db!.prepareAsync(`
      INSERT OR REPLACE INTO cached_tracks (
        id, title, artist, album, albumId, trackNumber, duration,
        filePath, uri, mimeType, year, bitrate, fileSize, composer,
        lyrics, cachedAt, lastPlayed, playCount, coverCached
      ) VALUES (
        $id, $title, $artist, $album, $albumId, $trackNumber, $duration,
        $filePath, $uri, $mimeType, $year, $bitrate, $fileSize, $composer,
        $lyrics, $cachedAt, $lastPlayed, $playCount, $coverCached
      )
    `);

    try {
      await statement.executeAsync({
        $id: track.id,
        $title: track.title,
        $artist: track.artist,
        $album: track.album,
        $albumId: track.albumId,
        $trackNumber: track.trackNumber,
        $duration: track.duration,
        $filePath: track.filePath,
        $uri: track.uri,
        $mimeType: track.mimeType,
        $year: track.year,
        $bitrate: track.bitrate,
        $fileSize: track.fileSize,
        $composer: track.composer,
        $lyrics: track.lyrics || null,
        $cachedAt: now,
        $lastPlayed: now,
        $playCount: 0,
        $coverCached: track.coverArt ? 1 : 0,
      });
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Cache em lote
  async cacheMultipleTracks(tracks: TrackDetails[]): Promise<void> {
    await this.initialize();

    const now = Date.now();
    const statement = await this.db!.prepareAsync(`
      INSERT OR REPLACE INTO cached_tracks (
        id, title, artist, album, albumId, trackNumber, duration,
        filePath, uri, mimeType, year, bitrate, fileSize, composer,
        lyrics, cachedAt, lastPlayed, playCount, coverCached
      ) VALUES (
        $id, $title, $artist, $album, $albumId, $trackNumber, $duration,
        $filePath, $uri, $mimeType, $year, $bitrate, $fileSize, $composer,
        $lyrics, $cachedAt, $lastPlayed, $playCount, $coverCached
      )
    `);

    try {
      for (const track of tracks) {
        await statement.executeAsync({
          $id: track.id,
          $title: track.title,
          $artist: track.artist,
          $album: track.album,
          $albumId: track.albumId,
          $trackNumber: track.trackNumber,
          $duration: track.duration,
          $filePath: track.filePath,
          $uri: track.uri,
          $mimeType: track.mimeType,
          $year: track.year,
          $bitrate: track.bitrate,
          $fileSize: track.fileSize,
          $composer: track.composer,
          $lyrics: track.lyrics || null,
          $cachedAt: now,
          $lastPlayed: now,
          $playCount: 0,
          $coverCached: track.coverArt ? 1 : 0,
        });
      }
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Buscar música do cache
  async getCachedTrack(id: string): Promise<CachedTrack | null> {
    await this.initialize();

    const statement = await this.db!.prepareAsync(`
      SELECT * FROM cached_tracks WHERE id = $id
    `);

    try {
      const result = await statement.executeAsync<CachedTrack>({ $id: id });
      const track = await result.getFirstAsync();

      if (track) {
        // Atualizar lastPlayed e playCount
        await this.updatePlayStats(id);
      }

      return track || null;
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Buscar múltiplas músicas
  async getCachedTracks(ids: string[]): Promise<CachedTrack[]> {
    await this.initialize();

    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const statement = await this.db!.prepareAsync(`
      SELECT * FROM cached_tracks WHERE id IN (${placeholders})
    `);

    try {
      const result = await statement.executeAsync<CachedTrack>(...ids);
      const tracks = await result.getAllAsync();

      // Atualizar stats em background
      tracks.forEach((track) => this.updatePlayStats(track.id));

      return tracks;
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Buscar todas as músicas em cache
  async getAllCachedTracks(): Promise<CachedTrack[]> {
    await this.initialize();

    const statement = await this.db!.prepareAsync(`
      SELECT * FROM cached_tracks ORDER BY lastPlayed DESC
    `);

    try {
      const result = await statement.executeAsync<CachedTrack>();
      return await result.getAllAsync();
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Atualizar estatísticas de reprodução
  async updatePlayStats(id: string): Promise<void> {
    await this.initialize();

    const statement = await this.db!.prepareAsync(`
      UPDATE cached_tracks 
      SET lastPlayed = $lastPlayed, 
          playCount = playCount + 1 
      WHERE id = $id
    `);

    try {
      await statement.executeAsync({
        $id: id,
        $lastPlayed: Date.now(),
      });
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Cache de capa de álbum
  async cacheCoverArt(trackId: string, imageUrl: string): Promise<string> {
    await this.initialize();

    const fileName = `${trackId}_cover.jpg`;
    const cachePath = COVER_CACHE_DIR + fileName;

    try {
      // Verificar se já existe
      const existing = await FileSystem.getInfoAsync(cachePath);
      if (existing.exists) {
        return cachePath;
      }

      // Baixar e salvar capa
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        cachePath,
      );

      if (downloadResult.status === 200) {
        // Atualizar banco de dados
        const statement = await this.db!.prepareAsync(`
          UPDATE cached_tracks 
          SET coverCached = 1, coverPath = $coverPath 
          WHERE id = $id
        `);

        try {
          await statement.executeAsync({
            $id: trackId,
            $coverPath: cachePath,
          });
        } finally {
          await statement.finalizeAsync();
        }

        return cachePath;
      }
    } catch (error) {
      console.error("Erro ao cachear capa:", error);
    }

    return "";
  }

  // Limpar cache antigo
  async cleanupCache(): Promise<void> {
    await this.initialize();

    const cutoffTime =
      Date.now() - CACHE_CONFIG.MAX_AGE_DAYS * 24 * 3600 * 1000;

    // Buscar músicas antigas
    const statement = await this.db!.prepareAsync(`
      SELECT id, coverPath FROM cached_tracks 
      WHERE lastPlayed < $cutoffTime
    `);

    let oldTracks: { id: string; coverPath?: string }[] = [];

    try {
      const result = await statement.executeAsync<{
        id: string;
        coverPath?: string;
      }>({
        $cutoffTime: cutoffTime,
      });
      oldTracks = await result.getAllAsync();
    } finally {
      await statement.finalizeAsync();
    }

    // Remover arquivos de capa
    for (const track of oldTracks) {
      if (track.coverPath) {
        try {
          await FileSystem.deleteAsync(track.coverPath, { idempotent: true });
        } catch (error) {
          console.error("Erro ao remover capa:", error);
        }
      }
    }

    // Remover do banco de dados
    const deleteStatement = await this.db!.prepareAsync(`
      DELETE FROM cached_tracks WHERE lastPlayed < $cutoffTime
    `);

    try {
      await deleteStatement.executeAsync({ $cutoffTime: cutoffTime });
    } finally {
      await deleteStatement.finalizeAsync();
    }

    // Verificar tamanho total do cache
    await this.enforceSizeLimit();
  }

  // Garantir limite de tamanho
  async enforceSizeLimit(): Promise<void> {
    const stats = await this.getCacheStats();

    if (stats.totalSize > CACHE_CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024) {
      // Remover as músicas menos reproduzidas
      const overage =
        stats.totalSize - CACHE_CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024;
      const tracksToRemove = Math.ceil(overage / (1024 * 1024)); // Assumindo ~1MB por música

      const statement = await this.db!.prepareAsync(`
        SELECT id, coverPath FROM cached_tracks 
        ORDER BY playCount ASC, lastPlayed ASC 
        LIMIT $limit
      `);

      let tracksToDelete: { id: string; coverPath?: string }[] = [];

      try {
        const result = await statement.executeAsync<{
          id: string;
          coverPath?: string;
        }>({
          $limit: tracksToRemove,
        });
        tracksToDelete = await result.getAllAsync();
      } finally {
        await statement.finalizeAsync();
      }

      // Remover arquivos e registros
      for (const track of tracksToDelete) {
        if (track.coverPath) {
          await FileSystem.deleteAsync(track.coverPath, { idempotent: true });
        }

        const deleteStatement = await this.db!.prepareAsync(`
          DELETE FROM cached_tracks WHERE id = $id
        `);

        try {
          await deleteStatement.executeAsync({ $id: track.id });
        } finally {
          await deleteStatement.finalizeAsync();
        }
      }
    }
  }

  // Estatísticas do cache
  async getCacheStats(): Promise<CacheStats> {
    await this.initialize();

    const statement = await this.db!.prepareAsync(`
      SELECT 
        COUNT(*) as totalTracks,
        SUM(fileSize) as totalSize,
        MIN(cachedAt) as oldestTrack,
        MAX(cachedAt) as newestTrack,
        SUM(CASE WHEN coverCached = 1 THEN 1 ELSE 0 END) as coversCount
      FROM cached_tracks
    `);

    try {
      const result = await statement.executeAsync<{
        totalTracks: number;
        totalSize: number;
        oldestTrack: number;
        newestTrack: number;
        coversCount: number;
      }>();
      const stats = await result.getFirstAsync();

      // Calcular tamanho das capas
      let coverCacheSize = 0;
      const coverFiles = await FileSystem.readDirectoryAsync(COVER_CACHE_DIR);
      for (const file of coverFiles) {
        const info = await FileSystem.getInfoAsync(COVER_CACHE_DIR + file);
        if (info.exists) {
          coverCacheSize += info.size || 0;
        }
      }

      return {
        totalTracks: stats?.totalTracks || 0,
        totalSize: stats?.totalSize || 0,
        oldestTrack: stats?.oldestTrack || 0,
        newestTrack: stats?.newestTrack || 0,
        coverCacheSize,
      };
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Limpar todo o cache
  async clearCache(): Promise<void> {
    await this.initialize();

    // Remover todas as capas
    const coverFiles = await FileSystem.readDirectoryAsync(COVER_CACHE_DIR);
    for (const file of coverFiles) {
      await FileSystem.deleteAsync(COVER_CACHE_DIR + file, {
        idempotent: true,
      });
    }

    // Limpar banco
    await this.db!.execAsync(`DELETE FROM cached_tracks`);
    await this.db!.execAsync(`DELETE FROM cache_metadata`);
  }

  // Remover música específica do cache
  async removeFromCache(id: string): Promise<void> {
    await this.initialize();

    // Buscar coverPath
    const statement = await this.db!.prepareAsync(`
      SELECT coverPath FROM cached_tracks WHERE id = $id
    `);

    let coverPath: string | undefined;

    try {
      const result = await statement.executeAsync<{ coverPath?: string }>({
        $id: id,
      });
      const track = await result.getFirstAsync();
      coverPath = track?.coverPath;
    } finally {
      await statement.finalizeAsync();
    }

    // Remover capa
    if (coverPath) {
      await FileSystem.deleteAsync(coverPath, { idempotent: true });
    }

    // Remover registro
    const deleteStatement = await this.db!.prepareAsync(`
      DELETE FROM cached_tracks WHERE id = $id
    `);

    try {
      await deleteStatement.executeAsync({ $id: id });
    } finally {
      await deleteStatement.finalizeAsync();
    }
  }

  // Metadata helpers
  private async getMetadata(key: string): Promise<string | null> {
    const statement = await this.db!.prepareAsync(`
      SELECT value FROM cache_metadata WHERE key = $key
    `);

    try {
      const result = await statement.executeAsync<{ value: string }>({
        $key: key,
      });
      const row = await result.getFirstAsync();
      return row?.value || null;
    } finally {
      await statement.finalizeAsync();
    }
  }

  private async setMetadata(key: string, value: string): Promise<void> {
    const statement = await this.db!.prepareAsync(`
      INSERT OR REPLACE INTO cache_metadata (key, value, updatedAt)
      VALUES ($key, $value, $updatedAt)
    `);

    try {
      await statement.executeAsync({
        $key: key,
        $value: value,
        $updatedAt: Date.now(),
      });
    } finally {
      await statement.finalizeAsync();
    }
  }

  // Fechar conexão
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      initPromise = null;
    }
  }
}

// Exportar instância única
export const musicCache = MusicCache.getInstance();
