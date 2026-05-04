// PrivacySettings.tsx
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { BackButton } from "@/components/black-button";
import { useAppUpdaterContext } from "@/components/update/app-update-context";
import { useTheme } from "@/context/ThemeContext";
import {
  startBackgroundUpdateCheck,
  stopBackgroundUpdateCheck,
} from "@/services/updates/backgroundupdate.service";
import { nativeGetAppVersion } from "@/services/updates/updateBridge.service";
import { Colors } from "@/types/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Download, RefreshCcwDot } from "lucide-react-native";
import { ComponentType, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import {
  disableNotifications,
  enableNotifications,
} from "../../../services/notification.service";

const GITHUB_REPO_OWNER = "glopmts";
const GITHUB_REPO_NAME = "blep-play";

// Chaves de storage para cada switch
const STORAGE_KEYS = {
  bgUpdate: "pref_bg_update",
  notifications: "pref_notifications",
  appCheck: "pref_app_check",
} as const;

type SettingKey = keyof typeof STORAGE_KEYS;

// Estado global de todos os switches
type SettingsState = Record<SettingKey, boolean>;

const PrivacySettings = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const { checkForUpdates } = useAppUpdaterContext();

  const [settings, setSettings] = useState<SettingsState>({
    bgUpdate: true,
    notifications: true,
    appCheck: true,
  });

  useEffect(() => {
    const loadAll = async () => {
      const entries = await Promise.all(
        Object.entries(STORAGE_KEYS).map(async ([key, storageKey]) => {
          const val = await AsyncStorage.getItem(storageKey);
          // null = nunca salvo → padrão true
          return [key, val === null ? true : val === "true"] as const;
        }),
      );

      setSettings(Object.fromEntries(entries) as SettingsState);
      setLoading(false);
    };

    loadAll();
  }, []);

  const handleToggle = async (key: SettingKey, value: boolean) => {
    // Atualiza só aquele item no estado
    setSettings((prev) => ({ ...prev, [key]: value }));

    await AsyncStorage.setItem(STORAGE_KEYS[key], String(value));

    if (key === "bgUpdate") {
      if (value) {
        const versionInfo = await nativeGetAppVersion();
        const currentVersion = versionInfo?.versionName ?? "0.0.0";
        await startBackgroundUpdateCheck({
          repoOwner: GITHUB_REPO_OWNER,
          repoName: GITHUB_REPO_NAME,
          currentVersion,
        });
      } else {
        await stopBackgroundUpdateCheck();
      }
    }

    if (key === "notifications") {
      if (value) {
        // Tentou ativar
        const granted = await enableNotifications();

        if (!granted) {
          // Permissão negada → reverte o switch visualmente
          setSettings((prev) => ({ ...prev, notifications: false }));
          await AsyncStorage.setItem(STORAGE_KEYS.notifications, "false");
        }
        // Se granted === true, o switch já está true, não precisa fazer nada
      } else {
        // Desativou no switch
        await disableNotifications();
        // O switch já foi atualizado pelo setSettings genérico acima
      }
    }

    if (key === "appCheck") {
      await checkForUpdates(value);
    }
  };

  // ✅ Cada item tem seu próprio value e onToggle
  const LABEL_ACTIONS: {
    id: SettingKey;
    label: string;
    description: string;
    icon?: ComponentType<{ size: number; color: string }>;
  }[] = [
    {
      id: "bgUpdate",
      icon: RefreshCcwDot,
      label: "Verificar atualizações automaticamente",
      description: "Notifica quando uma nova versão estiver disponível",
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      description: "Receber notificações no app?",
    },
    {
      id: "appCheck",
      icon: Download,
      label: "Verificação de atualizações app",
      description: "Verifique automaticamente verificação de updates app",
    },
  ];

  return (
    <LayoutWithHeader statusBarOpen={false} header={false}>
      <View style={{ padding: 16 }}>
        <BackButton
          position="relative"
          style={{ paddingTop: 8, paddingHorizontal: 1 }}
        />
        <View style={{ marginTop: 16 }} />
        <View className="p-3">
          <Text className="text text-2xl" style={{ color: colors.text }}>
            Configurações avançadas
          </Text>

          <View className="mt-8 flex-col gap-4">
            {LABEL_ACTIONS.map((item) => (
              <Card
                key={item.id}
                label={item.label}
                description={item.description}
                colors={colors}
                icon={item.icon}
                loading={loading}
                isEnabled={settings[item.id]}
                onToggle={(val) => handleToggle(item.id, val)}
              />
            ))}
          </View>
        </View>
      </View>
    </LayoutWithHeader>
  );
};

interface CardInterface {
  label: string;
  description?: string;
  colors: Colors;
  icon?: ComponentType<{ size: number; color: string }>;
  loading?: boolean;
  isEnabled?: boolean;
  onToggle: (value: boolean) => void;
}

const Card = ({
  label,
  loading,
  isEnabled,
  icon,
  description,
  colors,
  onToggle,
}: CardInterface) => {
  const Icon = icon;

  return (
    <View
      className="p-4"
      style={{
        backgroundColor: colors.card,
        borderRadius: colors.rounded.rounded_2xl,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className="w-12 h-12  items-center justify-center mr-3"
            style={{
              backgroundColor: colors.border,
              borderRadius: colors.rounded.rounded_3xl,
            }}
          >
            {Icon && <Icon size={24} color={colors.primary} />}
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 15 }}>{label}</Text>
            {description && (
              <Text
                className="text text-sm"
                style={{ color: colors.textMuted }}
              >
                {description}
              </Text>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={isEnabled}
            onValueChange={onToggle}
            thumbColor={isEnabled ? colors.primary : "#f4f3f4"}
            trackColor={{
              false: colors.border,
              true: colors.primary + "66",
            }}
          />
        )}
      </View>
    </View>
  );
};

export default PrivacySettings;
