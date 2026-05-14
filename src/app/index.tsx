import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { initI18n } from "../../i18next/i18n.ts";
import ActivityIndicatorCustom from "../components/activityIndicator-Custom";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await initI18n();
      } catch (error) {
        console.error("Erro ao carregar app:", error);
      } finally {
        await SplashScreen.hideAsync();
        setReady(true);
      }
    };

    loadApp();
  }, []);

  if (!ready) {
    return <ActivityIndicatorCustom isImage={true} />;
  }

  return <Redirect href="/(main)/(tabs)" />;
}
