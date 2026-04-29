import { useTheme } from "@/context/ThemeContext";
import { Stack } from "expo-router";

const LayoutPages = () => {
  const { isDark } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: isDark ? "#fff" : "#000",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name="details-album/[id]" />
      <Stack.Screen name="details-music/[id]" />
      <Stack.Screen name="details-playlist/[id]" />
      <Stack.Screen
        name="player"
        options={{
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
    </Stack>
  );
};

export default LayoutPages;
