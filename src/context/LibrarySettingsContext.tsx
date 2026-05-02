import {
  dbAddScanFolder,
  dbGetScanFolders,
  dbRemoveScanFolder,
  dbSetScanResult,
  dbToggleScanFolder,
  ScanFolder,
  settingsGet,
  settingsSet,
} from "@/database/library-settings";
import { getTracksByFolders } from "@/modules/music-library.module";
import { TrackDetails } from "@/types/interfaces";
import * as FileSystem from "expo-file-system/legacy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const KEY_AUTO_SCAN = "auto_scan";
const KEY_SHOW_DUPES = "show_duplicates";
const KEY_ENABLED = "library_enabled";

const DEFAULT_FOLDER = {
  path: "/storage/emulated/0/Music",
  name: "Music",
};

interface LibrarySettingsContextValue {
  ready: boolean; // ← chave: só true após carregar do DB
  scanFolders: ScanFolder[];
  activePaths: string[]; // pastas enabled — pronto para passar ao useMusics
  enabled: boolean;
  showDuplicates: boolean;
  autoScan: string;
  scanning: boolean;
  scanProgress: { folder: string; done: number; total: number } | null;
  scannedTracks: TrackDetails[];
  error: string | null;
  setEnabled: (v: boolean) => void;
  setShowDuplicates: (v: boolean) => void;
  setAutoScan: (v: string) => void;
  pickFolder: () => Promise<void>;
  addDefaultFolder: () => Promise<void>;
  removeFolder: (path: string) => Promise<void>;
  toggleFolder: (path: string, enabled: boolean) => Promise<void>;
  runScan: () => Promise<void>;
  cancelScan: () => void;
}

const LibrarySettingsContext =
  createContext<LibrarySettingsContextValue | null>(null);

export function LibrarySettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
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
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Carrega tudo do DB — só marca ready quando terminar
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
      setReady(true); // ← só agora
    });
  }, []);

  // Paths ativos derivados — memoizados por referência estável
  const activePaths = scanFolders.filter((f) => f.enabled).map((f) => f.path);

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

  const pickFolder = useCallback(async () => {
    try {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted) return;
      const path = contentUriToPath(perm.directoryUri);
      const name = path.split("/").filter(Boolean).pop() ?? path;
      await dbAddScanFolder(path, name);
      const updated = await dbGetScanFolders();
      if (mountedRef.current) setScanFolders(updated);
    } catch (e: any) {
      if (mountedRef.current)
        setError("Erro ao selecionar pasta: " + e?.message);
    }
  }, []);

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
        const tracks: TrackDetails[] = await getTracksByFolders([folder.path]);
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

  return (
    <LibrarySettingsContext.Provider
      value={{
        ready,
        scanFolders,
        activePaths,
        enabled,
        showDuplicates,
        autoScan,
        scanning,
        scanProgress,
        scannedTracks,
        error,
        setEnabled,
        setShowDuplicates,
        setAutoScan,
        pickFolder,
        addDefaultFolder,
        removeFolder,
        toggleFolder,
        runScan,
        cancelScan,
      }}
    >
      {children}
    </LibrarySettingsContext.Provider>
  );
}

export function useLibrarySettingsContext() {
  const ctx = useContext(LibrarySettingsContext);
  if (!ctx)
    throw new Error(
      "useLibrarySettings must be used inside LibrarySettingsProvider",
    );
  return ctx;
}

function contentUriToPath(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const match = decoded.match(/\/tree\/([^/]+):(.*)$/);
    if (!match) return DEFAULT_FOLDER.path;
    const volume = match[1].toLowerCase();
    const rel = match[2];
    if (volume === "primary")
      return `/storage/emulated/0/${rel}`.replace(/\/$/, "");
    return `/storage/${match[1]}/${rel}`.replace(/\/$/, "");
  } catch {
    return DEFAULT_FOLDER.path;
  }
}
