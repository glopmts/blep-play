import { Stack, useLocalSearchParams } from "expo-router";
import { ThemeProvider } from "../context/theme-app";
import "../css/global.css";

function RootLayoutNav() {
  const params = useLocalSearchParams();

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: "#27272a",
          },
          title: Array.isArray(params.name)
            ? params.name.join(", ")
            : params.name,
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
