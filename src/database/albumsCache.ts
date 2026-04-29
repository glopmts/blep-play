import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getAlbumsDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  // Se já está inicializando, aguarda a mesma Promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const instance = await SQLite.openDatabaseAsync("albums_cache_v2.db");

      await instance.execAsync(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE IF NOT EXISTS albums_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS albums_numbers (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );

  -- Lista de álbuns (sem songs, sem base64 de faixas)
  CREATE TABLE IF NOT EXISTS albums_list (
    id           TEXT PRIMARY KEY,
    album        TEXT NOT NULL,
    artist       TEXT NOT NULL,
    numberOfSongs INTEGER NOT NULL,
    year         INTEGER NOT NULL,
    artworkBase64 TEXT,            -- pode ser null
    cached_at    INTEGER NOT NULL
  );
`);
      db = instance;
      return db;
    } catch (error) {
      // Reset para permitir nova tentativa
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

export async function dbGetString(key: string): Promise<string | undefined> {
  const db = await getAlbumsDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM albums_meta WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function dbSetString(key: string, value: string): Promise<void> {
  const db = await getAlbumsDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO albums_meta (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function dbRemoveStringAlbums(key: string): Promise<void> {
  const db = await getAlbumsDb();
  await db.runAsync("DELETE FROM albums_meta WHERE key = ?", [key]);
}

export async function dbGetNumber(key: string): Promise<number | undefined> {
  const db = await getAlbumsDb();
  const row = await db.getFirstAsync<{ value: number }>(
    "SELECT value FROM albums_numbers WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function dbSetNumber(key: string, value: number): Promise<void> {
  const db = await getAlbumsDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO albums_numbers (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function dbRemoveNumberAlbums(key: string): Promise<void> {
  const db = await getAlbumsDb();
  await db.runAsync("DELETE FROM albums_numbers WHERE key = ?", [key]);
}

export async function dbContains(key: string): Promise<boolean> {
  const db = await getAlbumsDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM albums_meta WHERE key = ?",
    [key],
  );
  return (row?.count ?? 0) > 0;
}

export async function dbClearAllAlbums(): Promise<void> {
  const db = await getAlbumsDb();
  await db.execAsync("DELETE FROM albums_meta; DELETE FROM albums_numbers;");
}
