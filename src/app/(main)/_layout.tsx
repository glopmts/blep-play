import PlayerMusicRecurrent from "@/components/player-music-current";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

const LayoutMain = () => {
  const { colors } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: colors.surface,
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
