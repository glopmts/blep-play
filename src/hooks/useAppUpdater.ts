import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearUpdateCache,
  getUpdateInfo,
  isNewerVersion,
  UpdateInfo,
} from "../services/githubApi";
import {
  nativeCancelDownload,
  nativeCanInstallPackages,
  nativeGetAppVersion,
  nativeRequestInstallPermission,
  nativeStartDownload,
  onUpdateEvent,
  ProgressPayload,
} from "../services/updates/updateBridge.service";

// ─ Types

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "complete"
  | "error"
  | "up_to_date"
  | "offline";

export interface DownloadState {
  progress: number; // 0-100
  downloadedFormatted: string;
  totalFormatted: string;
  speedFormatted: string;
}

export interface AppUpdaterState {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  currentVersion: string;
  downloadState: DownloadState;
  errorMessage: string | null;
  isUpdateModalVisible: boolean;
}

export interface AppUpdaterActions {
  checkForUpdates: (force?: boolean) => Promise<void>;
  startDownload: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  dismissModal: () => void;
  requestInstallPermission: () => Promise<void>;
}

// ─ Hook

const DEFAULT_DOWNLOAD: DownloadState = {
  progress: 0,
  downloadedFormatted: "0 B",
  totalFormatted: "0 B",
  speedFormatted: "0 B/s",
};

export function useAppUpdater(
  autoCheck = true,
): AppUpdaterState & AppUpdaterActions {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState("0.0.0");
  const [downloadState, setDownloadState] =
    useState<DownloadState>(DEFAULT_DOWNLOAD);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdateModalVisible, setModalVisible] = useState(false);

  // Prevent concurrent downloads
  const isDownloading = useRef(false);

  //  Load current version
  useEffect(() => {
    nativeGetAppVersion().then(({ versionName }) =>
      setCurrentVersion(versionName),
    );
  }, []);

  //  Event subscriptions─
  useEffect(() => {
    const subProgress = onUpdateEvent(
      "progressoDownload",
      (p: ProgressPayload) => {
        setDownloadState({
          progress: p.progress,
          downloadedFormatted: p.downloadedFormatted,
          totalFormatted: p.totalFormatted,
          speedFormatted: p.speedFormatted,
        });
      },
    );

    const subComplete = onUpdateEvent("downloadCompleto", () => {
      isDownloading.current = false;
      setStatus("installing");
    });

    const subError = onUpdateEvent("erroDownload", ({ error }) => {
      isDownloading.current = false;
      setStatus("error");
      setErrorMessage(error);
    });

    const subInstall = onUpdateEvent("statusInstalacao", ({ status: s }) => {
      if (s === "launched" || s === "complete") {
        setStatus("complete");
      } else if (s === "permission_required") {
        setStatus("error");
        setErrorMessage(
          "Permissão para instalar apps de fontes desconhecidas é necessária.",
        );
      }
    });

    return () => {
      subProgress.remove();
      subComplete.remove();
      subError.remove();
      subInstall.remove();
    };
  }, []);

  //  Check for updates─
  const checkForUpdates = useCallback(
    async (force = false) => {
      // Check connectivity first
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setStatus("offline");
        return;
      }

      setStatus("checking");
      setErrorMessage(null);

      try {
        if (force) await clearUpdateCache();
        const info = await getUpdateInfo(force);

        if (!info) {
          setStatus("up_to_date");
          return;
        }

        const hasUpdate = isNewerVersion(currentVersion, info.latestVersion);

        if (hasUpdate) {
          setUpdateInfo(info);
          setStatus("available");
          setModalVisible(true);
        } else {
          setStatus("up_to_date");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err?.message ?? "Erro ao verificar atualizações");
      }
    },
    [currentVersion],
  );

  // Auto-check on mount
  useEffect(() => {
    if (autoCheck) {
      // Small delay to not block initial render
      const timer = setTimeout(() => checkForUpdates(), 2000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkForUpdates]);

  //  Start download
  const startDownload = useCallback(async () => {
    if (!updateInfo || isDownloading.current) return;

    // Verify install permission before downloading
    const canInstall = await nativeCanInstallPackages();
    if (!canInstall) {
      await nativeRequestInstallPermission();
      // User will need to tap Download again after granting permission
      setErrorMessage(
        "Ative 'Fontes desconhecidas' nas configurações e tente novamente.",
      );
      setStatus("error");
      return;
    }

    isDownloading.current = true;
    setStatus("downloading");
    setDownloadState(DEFAULT_DOWNLOAD);
    setErrorMessage(null);

    try {
      await nativeStartDownload(
        updateInfo.apkUrl,
        updateInfo.latestVersion,
        updateInfo.apkSize,
      );
    } catch (err: any) {
      isDownloading.current = false;
      setStatus("error");
      setErrorMessage(err?.message ?? "Falha ao iniciar download");
    }
  }, [updateInfo]);

  //  Cancel download─
  const cancelDownload = useCallback(async () => {
    await nativeCancelDownload();
    isDownloading.current = false;
    setStatus("available");
    setDownloadState(DEFAULT_DOWNLOAD);
  }, []);

  //  Dismiss modal─
  const dismissModal = useCallback(() => {
    if (status === "downloading") return; // can't dismiss while downloading
    setModalVisible(false);
    setStatus("idle");
  }, [status]);

  //  Request permission
  const requestInstallPermission = useCallback(async () => {
    await nativeRequestInstallPermission();
  }, []);

  return {
    // state
    status,
    updateInfo,
    currentVersion,
    downloadState,
    errorMessage,
    isUpdateModalVisible,
    // actions
    checkForUpdates,
    startDownload,
    cancelDownload,
    dismissModal,
    requestInstallPermission,
  };
}
