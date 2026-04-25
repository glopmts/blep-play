import PlayerMusicRecurrent from "@/components/player-music-current";
import { AppUpdater } from "@/components/update/app-update-context";
import { AlbumsProvider } from "@/context/albums-context";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

const LayoutMain = () => {
  const { isDark, colors } = useTheme();

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
