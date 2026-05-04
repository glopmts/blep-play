import PlayerMusicRecurrent from "@/components/player-music-current";
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
      <PlayerMusicRecurrent />
    </>
  );
};

export default LayoutMain;
