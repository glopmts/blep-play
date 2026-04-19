import PlayerMusicRecurrent from "@/components/player-music-current";
import { AlbumsProvider } from "@/context/AlbumsContext";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const LayoutMain = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
      <PlayerMusicRecurrent />
    </AlbumsProvider>
  );
};

export default LayoutMain;
