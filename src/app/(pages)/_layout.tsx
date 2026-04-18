import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const LayoutPages = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
    </Stack>
  );
};

export default LayoutPages;
