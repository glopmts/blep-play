// Drop this anywhere in your component tree (e.g. inside _layout.tsx).
// It auto-checks on mount and shows the update modal when a new version is found.

import { useAppUpdater } from "@/hooks/useAppUpdater";
import React from "react";
import { UpdateModal } from "./update-modal";

interface AppUpdaterProps {
  /** Set to false to disable auto-check on mount */
  autoCheck?: boolean;
}

export function AppUpdater({ autoCheck = true }: AppUpdaterProps) {
  const updater = useAppUpdater(autoCheck);

  return (
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
  );
}

// Re-export hook for manual use
export { useAppUpdater };
