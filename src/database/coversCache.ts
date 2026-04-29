import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getCoversDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const instance = await SQLite.openDatabaseAsync("covers_cache_v2.db");

      await instance.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;

        CREATE TABLE IF NOT EXISTS covers_cache (
          id TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS covers_ts (
          album_id TEXT PRIMARY KEY,
          ts INTEGER NOT NULL
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

// ─── Equivalentes ao MMKV

export async function dbGetString(id: string): Promise<string | undefined> {
  const db = await getCoversDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM covers_cache WHERE id = ?",
    [id],
  );
  return row?.value;
}

export async function dbSetString(id: string, value: string): Promise<void> {
  const db = await getCoversDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO covers_cache (id, value) VALUES (?, ?)",
    [id, value],
  );
}

export async function dbRemove(id: string): Promise<void> {
  const db = await getCoversDb();
  await db.runAsync("DELETE FROM covers_cache WHERE id = ?", [id]);
}

export async function dbClearAll(): Promise<void> {
  const db = await getCoversDb();
  await db.execAsync("DELETE FROM covers_cache; DELETE FROM covers_ts;");
}

export async function dbGetNumber(key: string): Promise<number | undefined> {
  const db = await getCoversDb();
  const row = await db.getFirstAsync<{ ts: number }>(
    "SELECT ts FROM covers_ts WHERE album_id = ?",
    [key],
  );
  return row?.ts;
}

export async function dbSetNumber(key: string, value: number): Promise<void> {
  const db = await getCoversDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO covers_ts (album_id, ts) VALUES (?, ?)",
    [key, value],
  );
}
