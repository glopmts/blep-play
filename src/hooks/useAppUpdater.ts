import {
  startBackgroundUpdateCheck,
  stopBackgroundUpdateCheck,
  updateStoredVersion,
} from "@/services/updates/backgroundupdate.service";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearUpdateCache,
  getUpdateInfo,
  isNewerVersion,
  UpdateInfo,
} from "../services/updates/githubApi.service";
import {
  nativeCancelDownload,
  nativeCanInstallPackages,
  nativeGetAppVersion,
  nativeRequestInstallPermission,
  nativeStartDownload,
  onUpdateEvent,
  ProgressPayload,
} from "../services/updates/updateBridge.service";

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
  progress: number; // 0–100
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

const GITHUB_REPO_OWNER = "glopmts";
const GITHUB_REPO_NAME = "blep-play";

const DEFAULT_DOWNLOAD: DownloadState = {
  progress: 0,
  downloadedFormatted: "0 B",
  totalFormatted: "0 B",
  speedFormatted: "0 B/s",
};

function isDevVersion(version: string): boolean {
  const devPatterns = [/-alpha$/i, /-beta$/i, /-rc\d*$/i, /-snapshot$/i];
  return devPatterns.some((p) => p.test(version));
}

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

  const isDownloading = useRef(false);

  // ─ Lê versão nativa ao montar
  useEffect(() => {
    nativeGetAppVersion().then((version) => {
      if (!version) return;
      setCurrentVersion(version.versionName);
    });
  }, []);

  // ─ Registra eventos do download nativo
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
        // Atualiza versão no módulo nativo após instalação bem-sucedida
        updateStoredVersion(currentVersion).catch(() => {});
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
  }, [currentVersion]);

  // ─ Inicia verificação em background quando a versão está disponível
  useEffect(() => {
    if (!currentVersion || currentVersion === "0.0.0") return;
    if (isDevVersion(currentVersion)) return;

    startBackgroundUpdateCheck({
      repoOwner: GITHUB_REPO_OWNER,
      repoName: GITHUB_REPO_NAME,
      currentVersion,
    }).catch(() => {
      // silencioso: background check é best-effort
    });

    // Cancela ao desmontar (ex: logout)
    return () => {
      stopBackgroundUpdateCheck().catch(() => {});
    };
  }, [currentVersion]);

  // ─ Verificação foreground (em tela)
  const checkForUpdates = useCallback(
    async (force = false) => {
      if (isDevVersion(currentVersion)) {
        setStatus("up_to_date");
        return;
      }

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

  // ─ Auto-check ao montar (foreground)
  useEffect(() => {
    if (autoCheck) {
      const timer = setTimeout(() => checkForUpdates(), 2000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkForUpdates]);

  // ─ Inicia download do APK
  const startDownload = useCallback(async () => {
    if (!updateInfo || isDownloading.current) return;

    if (isDevVersion(currentVersion)) {
      setErrorMessage(
        "Downloads não disponíveis em versões de desenvolvimento",
      );
      setStatus("error");
      return;
    }

    const canInstall = await nativeCanInstallPackages();
    if (!canInstall) {
      await nativeRequestInstallPermission();
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
  }, [updateInfo, currentVersion]);

  // ─ Cancela download
  const cancelDownload = useCallback(async () => {
    await nativeCancelDownload();
    isDownloading.current = false;
    setStatus("available");
    setDownloadState(DEFAULT_DOWNLOAD);
  }, []);

  // ─ Fecha modal
  const dismissModal = useCallback(() => {
    if (status === "downloading") return;
    setModalVisible(false);
    setStatus("idle");
  }, [status]);

  // ─ Solicita permissão de instalação
  const requestInstallPermission = useCallback(async () => {
    await nativeRequestInstallPermission();
  }, []);

  return {
    status,
    updateInfo,
    currentVersion,
    downloadState,
    errorMessage,
    isUpdateModalVisible,
    checkForUpdates,
    startDownload,
    cancelDownload,
    dismissModal,
    requestInstallPermission,
  };
}
