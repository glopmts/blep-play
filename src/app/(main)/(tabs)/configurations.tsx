import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useAppUpdater } from "@/components/update/app-update-context";
import { UpdateModal } from "@/components/update/update-modal";
import { useTheme } from "@/context/ThemeContext";
import * as Application from "expo-application";
import { router } from "expo-router";
import {
  ChevronRight,
  Database,
  Download,
  FileMusicIcon,
  PaintbrushIcon,
  Settings,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const Configurations = () => {
  const { colors, isDark } = useTheme();
  const {
    checkForUpdates,
    status,
    updateInfo,
    currentVersion,
    downloadState,
    errorMessage,
    isUpdateModalVisible,
    startDownload,
    cancelDownload,
    dismissModal,
  } = useAppUpdater();
  const { t } = useTranslation();

  const handleCheckForUpdates = async () => {
    await checkForUpdates();
  };

  const NAVE_OPTIONS: NaveOptionsProps[] = [
    {
      id: 1,
      label: t("settings.options.localLibrary.label"),
      description: t("settings.options.localLibrary.description"),
      icon: FileMusicIcon,
      action: () => router.navigate("/(main)/(pages)/local-library"),
    },
    {
      id: 2,
      label: t("settings.options.privacy.label"),
      description: t("settings.options.privacy.description"),
      icon: Settings,
      action: () => router.navigate("/(main)/(pages)/privacy-setting"),
    },
    {
      id: 3,
      label: t("settings.options.appPreferences.label"),
      description: t("settings.options.appPreferences.description"),
      icon: PaintbrushIcon,
      action: () => router.navigate("/(main)/(pages)/app-config-preferenc"),
    },
    {
      id: 4,
      label: t("settings.options.cacheManager.label"),
      description: t("settings.options.cacheManager.description"),
      icon: Database,
      action: () => router.navigate("/(main)/(pages)/cache-maneger"),
    },
    {
      id: 5,
      label: t("settings.options.checkUpdate.label"),
      description: t("settings.options.checkUpdate.description"),
      infor: `v${Application.nativeApplicationVersion}`,
      icon: Download,
      action: () => handleCheckForUpdates(),
    },
  ];

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="px-4 pt-4">
          <View className="gap-3">
            {NAVE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={option.action}
                activeOpacity={0.7}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.card }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: isDark ? "#27272A" : "#E4E4E7" }}
                  >
                    {option.icon && (
                      <option.icon
                        size={24}
                        color={isDark ? colors.primary : "#18181B"}
                      />
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-base font-semibold mb-1"
                        style={{ color: colors.text }}
                      >
                        {option.label}
                      </Text>
                      {option.infor && (
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: isDark ? "#3F3F46" : "#E4E4E7",
                          }}
                        >
                          <Text
                            className="text-xs"
                            style={{ color: colors.textMuted }}
                          >
                            {option.infor}
                          </Text>
                        </View>
                      )}
                    </View>
                    {option.description && (
                      <Text
                        className="text-sm"
                        style={{ color: colors.textMuted }}
                      >
                        {option.description}
                      </Text>
                    )}
                  </View>

                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seção de suporte */}
          <View className="mt-8">
            <Text
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              {t("settings.support.sectionTitle")}
            </Text>

            <TouchableOpacity
              className="p-4 rounded-2xl mb-3"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                {t("settings.support.helpCenter.label")}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: colors.textMuted }}
              >
                {t("settings.support.helpCenter.description")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 rounded-2xl"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                {t("settings.support.terms.label")}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: colors.textMuted }}
              >
                {t("settings.support.terms.description")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center justify-center pt-8 pb-4">
          <Text
            className="text-sm text-center"
            style={{ color: colors.textMuted }}
          >
            {t("settings.footer.currentVersion")}
          </Text>
          <Text
            className="text-sm font-medium text-center"
            style={{ color: colors.textMuted }}
          >
            {Application.nativeApplicationVersion ?? "0.0.0"}
          </Text>
        </View>
      </ScrollView>

      <UpdateModal
        visible={isUpdateModalVisible}
        status={status}
        updateInfo={updateInfo}
        currentVersion={currentVersion}
        downloadState={downloadState}
        errorMessage={errorMessage}
        onStartDownload={startDownload}
        onCancelDownload={cancelDownload}
        onDismiss={dismissModal}
        onRetry={() => checkForUpdates(true)}
      />
    </LayoutWithHeader>
  );
};

export default Configurations;
