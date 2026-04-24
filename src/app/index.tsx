import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import ActivityIndicatorCustom from "../components/activityIndicator-Custom";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

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
    return <ActivityIndicatorCustom isImage={true} />;
  }

  return <Redirect href="/(main)/(tabs)" />;
}
