import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getAlbumDetailsDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const instance = await SQLite.openDatabaseAsync(
        "albums_cache_details_v2.db",
      );

      await instance.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;

        CREATE TABLE IF NOT EXISTS albums_meta (
          key       TEXT    PRIMARY KEY,
          value     TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS albums_numbers (
          key       TEXT    PRIMARY KEY,
          value     INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS albums_list (
          id            TEXT    PRIMARY KEY,
          album         TEXT    NOT NULL,
          artist        TEXT    NOT NULL,
          numberOfSongs INTEGER NOT NULL,
          year          INTEGER NOT NULL,
          artworkBase64 TEXT,
          cached_at     INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS album_details (
          album_id  TEXT    PRIMARY KEY,
          data      TEXT    NOT NULL,
          cached_at INTEGER NOT NULL
        );
      `);

      db = instance;
      return db;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

// ─── KV helpers ────────────────────────────────────────────────────────────

export async function dbGetString(key: string): Promise<string | undefined> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM albums_meta WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function dbSetString(key: string, value: string): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO albums_meta (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function dbRemoveString(key: string): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync("DELETE FROM albums_meta WHERE key = ?", [key]);
}

export async function dbGetNumber(key: string): Promise<number | undefined> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM albums_numbers WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function dbSetNumber(key: string, value: number): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO albums_numbers (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function dbRemoveNumber(key: string): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync("DELETE FROM albums_numbers WHERE key = ?", [key]);
}

export async function dbContains(key: string): Promise<boolean> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM albums_meta WHERE key = ?",
    [key],
  );
  return (row?.count ?? 0) > 0;
}

export async function dbClearAll(): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.execAsync(
    "DELETE FROM albums_meta; DELETE FROM albums_numbers; DELETE FROM album_details; DELETE FROM albums_list;",
  );
}

// ─── Albums list helpers ────────────────────────────────────────────────────

export interface AlbumRow {
  id: string;
  album: string;
  artist: string;
  numberOfSongs: number;
  year: number;
  artworkBase64: string | null;
  cached_at: number;
}

export async function dbUpsertAlbumList(
  albums: Omit<AlbumRow, "cached_at">[],
): Promise<void> {
  const db = await getAlbumDetailsDb();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    for (const a of albums) {
      await db.runAsync(
        `INSERT OR REPLACE INTO albums_list
           (id, album, artist, numberOfSongs, year, artworkBase64, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.album,
          a.artist,
          a.numberOfSongs,
          a.year,
          a.artworkBase64 ?? null,
          now,
        ],
      );
    }
  });
}

export async function dbGetAlbumList(): Promise<AlbumRow[]> {
  const db = await getAlbumDetailsDb();
  return db.getAllAsync<AlbumRow>(
    "SELECT * FROM albums_list ORDER BY album ASC",
  );
}

export async function dbGetAlbumListCachedAt(): Promise<number | null> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ cached_at: number }>(
    "SELECT MIN(cached_at) as cached_at FROM albums_list",
  );
  return row?.cached_at ?? null;
}

// ─── Album details helpers ──────────────────────────────────────────────────

export async function dbSetAlbumDetails<T>(
  albumId: string,
  data: T,
): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO album_details (album_id, data, cached_at)
     VALUES (?, ?, ?)`,
    [albumId, JSON.stringify(data), Date.now()],
  );
}

export async function dbGetAlbumDetails<T>(
  albumId: string,
): Promise<{ data: T; cachedAt: number } | null> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ data: string; cached_at: number }>(
    "SELECT data, cached_at FROM album_details WHERE album_id = ?",
    [albumId],
  );
  if (!row) return null;
  return {
    data: JSON.parse(row.data) as T,
    cachedAt: row.cached_at,
  };
}

export async function dbRemoveAlbumDetails(albumId: string): Promise<void> {
  const db = await getAlbumDetailsDb();
  await db.runAsync("DELETE FROM album_details WHERE album_id = ?", [albumId]);
}

export async function dbGetAlbumDetailsCachedAt(
  albumId: string,
): Promise<number | null> {
  const db = await getAlbumDetailsDb();
  const row = await db.getFirstAsync<{ cached_at: number }>(
    "SELECT cached_at FROM album_details WHERE album_id = ?",
    [albumId],
  );
  return row?.cached_at ?? null;
}

export async function dbIsAlbumDetailsFresh(
  albumId: string,
  maxAgeMs: number,
): Promise<boolean> {
  const cachedAt = await dbGetAlbumDetailsCachedAt(albumId);
  if (cachedAt === null) return false;
  return Date.now() - cachedAt < maxAgeMs;
}
