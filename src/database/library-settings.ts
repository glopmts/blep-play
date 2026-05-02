// Persiste as configurações da biblioteca local no mesmo SQLite pattern do projeto

import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getLibrarySettingsDb =
  async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) return db;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const instance = await SQLite.openDatabaseAsync(
          "library_settings_v1.db",
        );
        await instance.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;

        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        -- Pastas que o usuário escolheu escanear (múltiplas suportadas)
        CREATE TABLE IF NOT EXISTS scan_folders (
          path       TEXT    PRIMARY KEY,
          name       TEXT    NOT NULL,
          enabled    INTEGER NOT NULL DEFAULT 1,
          added_at   INTEGER NOT NULL
        );

        -- Resultado do último scan por pasta
        CREATE TABLE IF NOT EXISTS scan_results (
          path        TEXT    PRIMARY KEY,
          track_count INTEGER NOT NULL DEFAULT 0,
          scanned_at  INTEGER NOT NULL
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

// ── settings KV

export async function settingsGet(key: string): Promise<string | undefined> {
  const d = await getLibrarySettingsDb();
  const row = await d.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return row?.value;
}

export async function settingsSet(key: string, value: string): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
}

// ── scan_folders

export interface ScanFolder {
  path: string;
  name: string;
  enabled: boolean;
  added_at: number;
  track_count?: number; // join com scan_results
  scanned_at?: number;
}

export async function dbGetScanFolders(): Promise<ScanFolder[]> {
  const d = await getLibrarySettingsDb();
  const rows = await d.getAllAsync<{
    path: string;
    name: string;
    enabled: number;
    added_at: number;
    track_count: number | null;
    scanned_at: number | null;
  }>(`
    SELECT sf.path, sf.name, sf.enabled, sf.added_at,
           sr.track_count, sr.scanned_at
    FROM scan_folders sf
    LEFT JOIN scan_results sr ON sf.path = sr.path
    ORDER BY sf.added_at ASC
  `);
  return rows.map((r) => ({
    path: r.path,
    name: r.name,
    enabled: r.enabled === 1,
    added_at: r.added_at,
    track_count: r.track_count ?? undefined,
    scanned_at: r.scanned_at ?? undefined,
  }));
}

export async function dbAddScanFolder(
  path: string,
  name: string,
): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync(
    `INSERT OR IGNORE INTO scan_folders (path, name, enabled, added_at)
     VALUES (?, ?, 1, ?)`,
    [path, name, Date.now()],
  );
}

export async function dbRemoveScanFolder(path: string): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync("DELETE FROM scan_folders WHERE path = ?", [path]);
  await d.runAsync("DELETE FROM scan_results WHERE path = ?", [path]);
}

export async function dbToggleScanFolder(
  path: string,
  enabled: boolean,
): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync("UPDATE scan_folders SET enabled = ? WHERE path = ?", [
    enabled ? 1 : 0,
    path,
  ]);
}

export async function dbSetScanResult(
  path: string,
  trackCount: number,
): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync(
    `INSERT OR REPLACE INTO scan_results (path, track_count, scanned_at)
     VALUES (?, ?, ?)`,
    [path, trackCount, Date.now()],
  );
}

export async function dbClearScanResults(): Promise<void> {
  const d = await getLibrarySettingsDb();
  await d.runAsync("DELETE FROM scan_results");
}
