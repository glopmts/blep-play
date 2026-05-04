import {
  AppUpdaterActions,
  AppUpdaterState,
  useAppUpdater,
} from "@/hooks/useAppUpdater";
import React, { createContext, ReactNode, useContext } from "react";
import { UpdateModal } from "./update-modal";

// Tipo do contexto
type AppUpdaterContextValue = AppUpdaterState & AppUpdaterActions;

// Criação do contexto
const AppUpdaterContext = createContext<AppUpdaterContextValue | undefined>(
  undefined,
);

// Props do provider
interface AppUpdaterProviderProps {
  children: ReactNode;
  autoCheck?: boolean;
}

// Provider component
export function AppUpdaterProvider({
  children,
  autoCheck = true,
}: AppUpdaterProviderProps) {
  const updater = useAppUpdater(autoCheck);

  return (
    <AppUpdaterContext.Provider value={updater}>
      {children}

      {/* Modal global de atualização */}
      <UpdateModal
        visible={updater.isUpdateModalVisible}
        status={updater.status}
        updateInfo={updater.updateInfo}
        currentVersion={updater.currentVersion}
        downloadState={updater.downloadState}
        errorMessage={updater.errorMessage}
        onStartDownload={updater.startDownload}
        onCancelDownload={updater.cancelDownload}
        onDismiss={updater.dismissModal}
        onRetry={() => updater.checkForUpdates(true)}
      />
    </AppUpdaterContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useAppUpdaterContext() {
  const context = useContext(AppUpdaterContext);

  if (context === undefined) {
    throw new Error(
      "useAppUpdaterContext must be used within an AppUpdaterProvider",
    );
  }

  return context;
}

// Exporta o hook original para compatibilidade
export { useAppUpdater } from "@/hooks/useAppUpdater";
