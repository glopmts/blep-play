import PlayerMusicRecurrent from "@/components/player-music-current";
import { AppUpdater } from "@/components/update/app-update-context";
import { AlbumsProvider } from "@/context/albums-context";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";

const LayoutMain = () => {
  const { isDark } = useTheme();

  return (
    <AlbumsProvider>
      <Stack
        screenOptions={{
          headerTintColor: isDark ? "#fff" : "#000",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown: false,
        }}
      />
      <AppUpdater autoCheck={true} />
      <PlayerMusicRecurrent />
    </AlbumsProvider>
  );
};

export default LayoutMain;
