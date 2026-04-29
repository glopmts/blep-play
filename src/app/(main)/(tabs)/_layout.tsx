import { tabs } from "@/constants/data";
import { useTheme } from "@/hooks/useTheme";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Alert, View } from "react-native";

/// Pedir acesso as notificações aparelho

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync({
    android: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === "granted";
};

function TabIcon({
  Icon,
  color,
  size,
  focused,
}: {
  Icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: focused ? "rgba(166, 255, 77, 0.12)" : "transparent",
      }}
    >
      <Icon color={color} size={size ?? 22} />
    </View>
  );
}

export default function MainLayout() {
  const { isDark, colors } = useTheme();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  async function getAlbums() {
    if (permissionResponse?.status !== "granted") {
      const { status } = await requestPermission();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à biblioteca de mídia para usar este recurso.",
        );
        return false;
      }
    }
    return true;
  }

  useEffect(() => {
    const requestAll = async () => {
      const albumsAllowed = await getAlbums();
      if (albumsAllowed) {
      }

      const notificationsAllowed = await requestNotificationPermission();
      if (!notificationsAllowed) {
        Alert.alert(
          "Permissão para notificações",
          "Permita notificações para receber alertas importantes.",
        );
      }
    };

    requestAll();
  }, []);

  const ACTIVE_COLOR = "#A6FF4c";
  const INACTIVE_COLOR = isDark ? "#52525b" : "#a1a1aa";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
          height: 84,
          paddingBottom: 16,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0 : 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        animation: "fade",
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                Icon={tab.icon}
                color={color}
                size={size ?? 22}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
