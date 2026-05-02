import {
  ScanFolder,
  dbAddScanFolder,
  dbGetScanFolders,
  dbRemoveScanFolder,
  dbSetScanResult,
  dbToggleScanFolder,
  settingsGet,
  settingsSet,
} from "@/database/library-settings";
import { getTracksByFolderPath } from "@/modules/music-library.module";
import { TrackDetails } from "@/types/interfaces";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";

const KEY_AUTO_SCAN = "auto_scan";
const KEY_SHOW_DUPES = "show_duplicates";
const KEY_ENABLED = "library_enabled";

// Pasta padrão — usada quando o usuário ainda não escolheu nenhuma
const DEFAULT_FOLDER = {
  path: "/storage/emulated/0/Music",
  name: "Music",
};

export function useLibrarySettings() {
  const [scanFolders, setScanFolders] = useState<ScanFolder[]>([]);
  const [scannedTracks, setScannedTracks] = useState<TrackDetails[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    folder: string;
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabledState] = useState(true);
  const [showDuplicates, setShowDupsState] = useState(true);
  const [autoScan, setAutoScanState] = useState("Off");

  const mountedRef = useRef(true);
  const abortRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    abortRef.current = false;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Carrega estado inicial
  useEffect(() => {
    Promise.all([
      dbGetScanFolders(),
      settingsGet(KEY_ENABLED),
      settingsGet(KEY_SHOW_DUPES),
      settingsGet(KEY_AUTO_SCAN),
    ]).then(([folders, en, dupes, auto]) => {
      if (!mountedRef.current) return;
      setScanFolders(folders);
      if (en != null) setEnabledState(en === "true");
      if (dupes != null) setShowDupsState(dupes === "true");
      if (auto != null) setAutoScanState(auto);
    });
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    settingsSet(KEY_ENABLED, String(v));
  }, []);

  const setShowDuplicates = useCallback((v: boolean) => {
    setShowDupsState(v);
    settingsSet(KEY_SHOW_DUPES, String(v));
  }, []);

  const setAutoScan = useCallback((v: string) => {
    setAutoScanState(v);
    settingsSet(KEY_AUTO_SCAN, v);
  }, []);

  // ── Abre o picker nativo do Android
  // StorageAccessFramework retorna uma URI content:// tipo
  // "content://com.android.externalstorage.documents/tree/primary%3AMusic"
  // que convertemos para o path real /storage/emulated/0/Music
  const pickFolder = useCallback(async () => {
    try {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!perm.granted) return; // usuário cancelou

      // Converte content URI → path legível
      const contentUri = perm.directoryUri;
      const path = contentUriToPath(contentUri);
      const name = path.split("/").filter(Boolean).pop() ?? path;

      await dbAddScanFolder(path, name);
      const updated = await dbGetScanFolders();
      if (mountedRef.current) setScanFolders(updated);
    } catch (e: any) {
      if (mountedRef.current)
        setError("Erro ao selecionar pasta: " + e?.message);
    }
  }, []);

  // ── Adiciona a pasta padrão sem picker
  const addDefaultFolder = useCallback(async () => {
    const already = await dbGetScanFolders();
    if (already.some((f) => f.path === DEFAULT_FOLDER.path)) return;
    await dbAddScanFolder(DEFAULT_FOLDER.path, DEFAULT_FOLDER.name);
    const updated = await dbGetScanFolders();
    if (mountedRef.current) setScanFolders(updated);
  }, []);

  const removeFolder = useCallback(async (path: string) => {
    await dbRemoveScanFolder(path);
    const updated = await dbGetScanFolders();
    if (mountedRef.current) {
      setScanFolders(updated);
      setScannedTracks((prev) =>
        prev.filter((t) => !t.filePath.startsWith(path)),
      );
    }
  }, []);

  const toggleFolder = useCallback(async (path: string, enabled: boolean) => {
    await dbToggleScanFolder(path, enabled);
    setScanFolders((prev) =>
      prev.map((f) => (f.path === path ? { ...f, enabled } : f)),
    );
  }, []);

  // ── Scan
  const runScan = useCallback(async () => {
    const active = scanFolders.filter((f) => f.enabled);
    if (active.length === 0) {
      setError("Nenhuma pasta ativa. Adicione ao menos uma pasta.");
      return;
    }

    abortRef.current = false;
    setScanning(true);
    setError(null);
    setScannedTracks([]);

    const all: TrackDetails[] = [];

    for (let i = 0; i < active.length; i++) {
      if (abortRef.current || !mountedRef.current) break;

      const folder = active[i];
      setScanProgress({ folder: folder.name, done: i, total: active.length });

      try {
        const tracks: TrackDetails[] = await getTracksByFolderPath(folder.path);
        all.push(...(tracks ?? []));
        await dbSetScanResult(folder.path, tracks?.length ?? 0);

        setScanFolders((prev) =>
          prev.map((f) =>
            f.path === folder.path
              ? {
                  ...f,
                  track_count: tracks?.length ?? 0,
                  scanned_at: Date.now(),
                }
              : f,
          ),
        );

        if (mountedRef.current) setScannedTracks([...all]);
      } catch (e: any) {
        console.warn(`[scan] ${folder.path}:`, e?.message);
      }
    }

    if (mountedRef.current) {
      setScanProgress(null);
      setScanning(false);
    }
  }, [scanFolders]);

  const cancelScan = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    enabled,
    setEnabled,
    showDuplicates,
    setShowDuplicates,
    autoScan,
    setAutoScan,
    scanFolders,
    pickFolder, // abre SAF picker nativo
    addDefaultFolder, // adiciona /storage/emulated/0/Music direto
    removeFolder,
    toggleFolder,
    scannedTracks,
    scanning,
    scanProgress,
    runScan,
    cancelScan,
    error,
  };
}

// ── content:// → /storage/emulated/0/…
// "content://com.android.externalstorage.documents/tree/primary%3AMusic"
//   → /storage/emulated/0/Music
// "content://…/tree/primary%3ADownload%2FSongs"
//   → /storage/emulated/0/Download/Songs
function contentUriToPath(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    // Extrai a parte depois de "primary:" ou "XXXX-XXXX:"
    const match = decoded.match(/\/tree\/([^/]+):(.*)$/);
    if (!match) return DEFAULT_FOLDER.path;

    const volume = match[1].toLowerCase();
    const rel = match[2].replace(/\//g, "/"); // já é separado por /

    if (volume === "primary") {
      return `/storage/emulated/0/${rel}`.replace(/\/$/, "");
    }
    // SD card: /storage/<volume>/<rel>
    return `/storage/${match[1]}/${rel}`.replace(/\/$/, "");
  } catch {
    return DEFAULT_FOLDER.path;
  }
}
