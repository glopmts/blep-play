import { TrackDetails } from "@/types/interfaces";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

//  Configurações
const CACHE_CONFIG = {
  MAX_AGE_DAYS: 7,
  MAX_CACHE_SIZE_MB: 500,
  CLEANUP_INTERVAL_HOURS: 24,
};

const COVER_CACHE_DIR = `${FileSystem.cacheDirectory}music_covers/`;

//  Tipos
export interface CachedTrack extends TrackDetails {
  cachedAt?: number;
  lastPlayed?: number;
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

//  Classe principal
export class MusicCache {
  private static instance: MusicCache;
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MusicCache {
    if (!MusicCache.instance) {
      MusicCache.instance = new MusicCache();
    }
    return MusicCache.instance;
  }

  // ── Inicialização ─
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    // Garante diretório de capas
    const dirInfo = await FileSystem.getInfoAsync(COVER_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(COVER_CACHE_DIR, {
        intermediates: true,
      });
    }

    // SDK 55: openDatabaseSync
    this.db = SQLite.openDatabaseSync("music_cache_v2.db");

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS cached_tracks (
        id          TEXT    PRIMARY KEY,
        title       TEXT    NOT NULL,
        artist      TEXT,
        album       TEXT,
        albumId     TEXT,
        trackNumber INTEGER,
        duration    INTEGER,
        filePath    TEXT    NOT NULL,
        uri         TEXT,
        mimeType    TEXT,
        year        INTEGER,
        bitrate     INTEGER,
        fileSize    INTEGER,
        composer    TEXT,
        lyrics      TEXT,
        coverArt    TEXT,
        cachedAt    INTEGER NOT NULL,
        lastPlayed  INTEGER NOT NULL,
        playCount   INTEGER DEFAULT 0,
        coverCached INTEGER DEFAULT 0,
        coverPath   TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_last_played ON cached_tracks(lastPlayed);
      CREATE INDEX IF NOT EXISTS idx_play_count  ON cached_tracks(playCount);
      CREATE INDEX IF NOT EXISTS idx_cached_at   ON cached_tracks(cachedAt);

      CREATE TABLE IF NOT EXISTS cache_metadata (
        key       TEXT    PRIMARY KEY,
        value     TEXT,
        updatedAt INTEGER
      );
    `);

    await this._setupAutoCleanup();
  }

  private async _setupAutoCleanup(): Promise<void> {
    const lastCleanup = this._getMetadataSync("last_cleanup");
    const now = Date.now();
    if (
      !lastCleanup ||
      now - parseInt(lastCleanup) >
        CACHE_CONFIG.CLEANUP_INTERVAL_HOURS * 3_600_000
    ) {
      await this.cleanupCache();
      this._setMetadataSync("last_cleanup", now.toString());
    }
  }

  // ── Helpers de metadata (síncronos — chamados internamente) ──
  private _getMetadataSync(key: string): string | null {
    const row = this.db!.getFirstSync<{ value: string }>(
      `SELECT value FROM cache_metadata WHERE key = ?`,
      key,
    );
    return row?.value ?? null;
  }

  private _setMetadataSync(key: string, value: string): void {
    this.db!.runSync(
      `INSERT OR REPLACE INTO cache_metadata (key, value, updatedAt) VALUES (?, ?, ?)`,
      key,
      value,
      Date.now(),
    );
  }

  // ── Gravar ──
  async cacheTrack(track: TrackDetails): Promise<void> {
    await this.initialize();
    this._upsertTrackSync(track);
  }

  async cacheMultipleTracks(tracks: TrackDetails[]): Promise<void> {
    await this.initialize();
    // Envolve em transação para performance
    this.db!.withTransactionSync(() => {
      for (const track of tracks) {
        this._upsertTrackSync(track);
      }
    });
  }

  private _upsertTrackSync(track: TrackDetails): void {
    const now = Date.now();
    this.db!.runSync(
      `INSERT OR REPLACE INTO cached_tracks (
         id, title, artist, album, albumId, trackNumber, duration,
         filePath, uri, mimeType, year, bitrate, fileSize, composer,
         lyrics, coverArt, cachedAt, lastPlayed, playCount, coverCached
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      track.id,
      track.title,
      track.artist ?? null,
      track.album ?? null,
      track.albumId ?? null,
      track.trackNumber ?? null,
      track.duration,
      track.filePath,
      track.uri,
      track.mimeType ?? null,
      track.year ?? null,
      track.bitrate ?? null,
      track.fileSize ?? null,
      track.composer ?? null,
      track.lyrics ?? null,
      track.coverArt ?? null,
      now,
      now,
      0,
      track.coverArt ? 1 : 0,
    );
  }

  // ── Ler
  async getCachedTrack(id: string): Promise<CachedTrack | null> {
    await this.initialize();
    const track = this.db!.getFirstSync<CachedTrack>(
      `SELECT * FROM cached_tracks WHERE id = ?`,
      id,
    );
    if (track) this._updatePlayStatsSync(id);
    return track ?? null;
  }

  async getCachedTracks(ids: string[]): Promise<CachedTrack[]> {
    await this.initialize();
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const tracks = this.db!.getAllSync<CachedTrack>(
      `SELECT * FROM cached_tracks WHERE id IN (${placeholders})`,
      ...ids,
    );
    tracks.forEach((t) => this._updatePlayStatsSync(t.id));
    return tracks;
  }

  async getAllCachedTracks(): Promise<CachedTrack[]> {
    await this.initialize();
    return this.db!.getAllSync<CachedTrack>(
      `SELECT * FROM cached_tracks ORDER BY lastPlayed DESC`,
    );
  }

  // ── Estatísticas de reprodução ─
  async updatePlayStats(id: string): Promise<void> {
    await this.initialize();
    this._updatePlayStatsSync(id);
  }

  private _updatePlayStatsSync(id: string): void {
    this.db!.runSync(
      `UPDATE cached_tracks SET lastPlayed = ?, playCount = playCount + 1 WHERE id = ?`,
      Date.now(),
      id,
    );
  }

  // ── Capa de álbum ─
  async cacheCoverArt(trackId: string, imageUrl: string): Promise<string> {
    await this.initialize();

    const cachePath = `${COVER_CACHE_DIR}${trackId}_cover.jpg`;
    const existing = await FileSystem.getInfoAsync(cachePath);
    if (existing.exists) return cachePath;

    try {
      const { status } = await FileSystem.downloadAsync(imageUrl, cachePath);
      if (status === 200) {
        this.db!.runSync(
          `UPDATE cached_tracks SET coverCached = 1, coverPath = ? WHERE id = ?`,
          cachePath,
          trackId,
        );
        return cachePath;
      }
    } catch (err) {
      console.error("[MusicCache] cacheCoverArt:", err);
    }
    return "";
  }

  // ── Limpeza ─
  async cleanupCache(): Promise<void> {
    await this.initialize();

    const cutoff = Date.now() - CACHE_CONFIG.MAX_AGE_DAYS * 86_400_000;

    const old = this.db!.getAllSync<{ id: string; coverPath?: string }>(
      `SELECT id, coverPath FROM cached_tracks WHERE lastPlayed < ?`,
      cutoff,
    );

    for (const t of old) {
      if (t.coverPath) {
        await FileSystem.deleteAsync(t.coverPath, { idempotent: true }).catch(
          console.error,
        );
      }
    }

    this.db!.runSync(`DELETE FROM cached_tracks WHERE lastPlayed < ?`, cutoff);

    await this._enforceSizeLimit();
  }

  private async _enforceSizeLimit(): Promise<void> {
    const stats = await this.getCacheStats();
    const limitBytes = CACHE_CONFIG.MAX_CACHE_SIZE_MB * 1_048_576;
    if (stats.totalSize <= limitBytes) return;

    const overage = stats.totalSize - limitBytes;
    const removeCount = Math.ceil(overage / 1_048_576);

    const toDelete = this.db!.getAllSync<{ id: string; coverPath?: string }>(
      `SELECT id, coverPath FROM cached_tracks ORDER BY playCount ASC, lastPlayed ASC LIMIT ?`,
      removeCount,
    );

    for (const t of toDelete) {
      if (t.coverPath) {
        await FileSystem.deleteAsync(t.coverPath, {
          idempotent: true,
        }).catch(console.error);
      }
      this.db!.runSync(`DELETE FROM cached_tracks WHERE id = ?`, t.id);
    }
  }

  // ── Stats
  async getCacheStats(): Promise<CacheStats> {
    await this.initialize();

    const row = this.db!.getFirstSync<{
      totalTracks: number;
      totalSize: number;
      oldestTrack: number;
      newestTrack: number;
    }>(
      `SELECT COUNT(*) as totalTracks, SUM(fileSize) as totalSize,
              MIN(cachedAt) as oldestTrack, MAX(cachedAt) as newestTrack
       FROM cached_tracks`,
    );

    let coverCacheSize = 0;
    try {
      const files = await FileSystem.readDirectoryAsync(COVER_CACHE_DIR);
      for (const f of files) {
        const info = await FileSystem.getInfoAsync(COVER_CACHE_DIR + f);
        if (info.exists) coverCacheSize += (info as any).size ?? 0;
      }
    } catch {
      // diretório ainda não existe
    }

    return {
      totalTracks: row?.totalTracks ?? 0,
      totalSize: row?.totalSize ?? 0,
      oldestTrack: row?.oldestTrack ?? 0,
      newestTrack: row?.newestTrack ?? 0,
      coverCacheSize,
    };
  }

  // ── Limpar tudo
  async clearCache(): Promise<void> {
    await this.initialize();

    try {
      const files = await FileSystem.readDirectoryAsync(COVER_CACHE_DIR);
      for (const f of files) {
        await FileSystem.deleteAsync(COVER_CACHE_DIR + f, {
          idempotent: true,
        });
      }
    } catch {
      // diretório vazio
    }

    this.db!.execSync(`DELETE FROM cached_tracks; DELETE FROM cache_metadata;`);
  }

  async removeFromCache(id: string): Promise<void> {
    await this.initialize();

    const row = this.db!.getFirstSync<{ coverPath?: string }>(
      `SELECT coverPath FROM cached_tracks WHERE id = ?`,
      id,
    );

    if (row?.coverPath) {
      await FileSystem.deleteAsync(row.coverPath, {
        idempotent: true,
      }).catch(console.error);
    }

    this.db!.runSync(`DELETE FROM cached_tracks WHERE id = ?`, id);
  }

  // ── Fechar ──
  close(): void {
    if (this.db) {
      this.db.closeSync();
      this.db = null;
      this.initPromise = null;
    }
  }
}

export const musicCache = MusicCache.getInstance();
