import { tabs } from "@/constants/data";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { PermissionsAndroid, Platform, useColorScheme } from "react-native";
import { useAlbum } from "../../../hooks/useAlbumLocal";
import { useAlbumsGrouped } from "../../../hooks/useAlbumsGrouped";

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

const requestPermission = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== "granted") {
    return false;
  }
  return true;
};

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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

  // Recarrega quando a permissão for concedida
  useEffect(() => {
    if (permissionResponse?.granted) {
      refreshAlbums();
    }
  }, [permissionResponse?.granted]);

  useEffect(() => {
    if (permissionResponse2?.granted) {
      refreshGroupedAlbums();
    }
  }, [permissionResponse2?.granted]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          borderTopWidth: 0,
          height: 60,
        },
        tabBarActiveTintColor: isDark ? "#60a5fa" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#888888",
        tabBarBadgeStyle: {
          borderRadius: 16,
        },
        animation: "none",
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.icon color={color} size={size ?? 24} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
