import { tabs } from "@/constants/data";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { PermissionsAndroid, Platform, View } from "react-native";
import { useAlbum } from "../../../hooks/useAlbumLocal";
import { useAlbumsGrouped } from "../../../hooks/useAlbumsGrouped";
import { useTheme } from "../../../hooks/useTheme";

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
  if (Platform.OS === "android" && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
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

  const { refreshAlbums, permissionResponse, requestPermission } = useAlbum();
  const {
    refreshAlbums: refreshGroupedAlbums,
    permissionResponse: permissionResponse2,
    requestPermission: requestPermission2,
  } = useAlbumsGrouped();

  useEffect(() => {
    requestNotificationPermission();
    requestPermission();
    requestPermission2();
  }, []);

  useEffect(() => {
    if (permissionResponse?.granted) refreshAlbums();
  }, [permissionResponse?.granted]);

  useEffect(() => {
    if (permissionResponse2?.granted) refreshGroupedAlbums();
  }, [permissionResponse2?.granted]);

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
          // Sombra superior sutil no modo claro
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
