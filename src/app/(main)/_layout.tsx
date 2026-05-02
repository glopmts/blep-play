import PlayerMusicRecurrent from "@/components/player-music-current";
import { AppUpdater } from "@/components/update/app-update-context";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

const LayoutMain = () => {
  const { isDark } = useTheme();

  return (
    <>
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
    </>
  );
};

export default LayoutMain;
