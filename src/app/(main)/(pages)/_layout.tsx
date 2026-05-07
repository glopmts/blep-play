import { useTheme } from "@/context/ThemeContext";
import { Stack } from "expo-router";

const LayoutPages = () => {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.surface,
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
