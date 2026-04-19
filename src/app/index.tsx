import { Image } from "expo-image";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const loadApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Erro ao carregar app:", error);
      } finally {
        await SplashScreen.hideAsync();
        setIsLoading(false);
      }
    };

    loadApp();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-10 dark:bg-zinc-900">
        <Image
          source={require("../../assets/images/icon.png")}
          className="w-20 h-20 object-cover rounded-md"
          style={{
            width: 150,
            height: 150,
          }}
        />
        <ActivityIndicator size={36} color={isDark ? "#ffff" : "#3b82f6 "} />
      </View>
    );
  }

  return <Redirect href="/(main)/(tabs)" />;
}
