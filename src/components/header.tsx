import { Image } from "expo-image";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { Translations } from "../../i18next/locales/en";
import { useTheme } from "../context/ThemeContext";

type HeaderKey = keyof Translations["header"];

// Mapa de rota → chave i18n (sem barras)
const ROUTE_MAP: Record<string, HeaderKey> = {
  "/": "home",
  "/playlists": "playlists",
  "/albums": "albums",
  "/configurations": "configurations",
};

function getGreetingKey(): keyof Translations["greeting"] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "night";
}

const Header = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [greetingKey, setGreetingKey] = useState(getGreetingKey);

  // Atualiza a saudação via i18n a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingKey(getGreetingKey());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const headerKey: HeaderKey = ROUTE_MAP[pathname] ?? "default";

  const title = useMemo(() => {
    if (headerKey === "home") return t(`greeting.${greetingKey}`);
    return t(`header.${headerKey}.title`);
  }, [headerKey, greetingKey, t]);

  const subtitle = t(`header.${headerKey}.subtitle`);

  return (
    <View className="w-full p-5">
      <View className="flex items-center justify-between flex-row">
        <View className="flex flex-col gap-1 flex-1">
          <Text
            className="text-3xl font-bold"
            style={{ color: colors?.text ?? "#000" }}
          >
            {title}
          </Text>
          <Text
            className="text-base"
            style={{ color: colors?.text_gray ?? "#666" }}
          >
            {subtitle}
          </Text>
        </View>
        <Image
          source={require("../../assets/images/icon.png")}
          className="object-cover rounded-md"
          style={{ width: 75, height: 75 }}
        />
      </View>
    </View>
  );
};

export default Header;
