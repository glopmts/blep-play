import PlayerMusicRecurrent from "@/components/player-music-current";
import { AlbumsProvider } from "@/context/AlbumsContext";
import { Stack } from "expo-router";
import { AppUpdater } from "../../components/update/AppUpdater";
import { useTheme } from "../../hooks/useTheme";

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
