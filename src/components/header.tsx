import { Image } from "expo-image";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

const Header = () => {
  const { isDark, colors } = useTheme();
  const pathname = usePathname();
  const [greeting, setGreeting] = useState("");

  // Atualiza a saudação em tempo real
  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) setGreeting("Bom dia 👋");
      else if (currentHour >= 12 && currentHour < 18)
        setGreeting("Boa tarde 👋 ");
      else setGreeting("Boa noite 👋");
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Define o conteúdo baseado na página
  const getHeaderContent = () => {
    const pageMap = {
      "/": {
        title: greeting,
        subtitle: "Controle suas músicas em um único lugar",
      },
      "/playlists": {
        title: "Playlists",
        subtitle: "Suas playlists, do seu jeito",
      },
      "/albums": {
        title: "Álbuns",
        subtitle: "Crie e organize seus álbuns",
      },
    };

    return (
      pageMap[pathname as keyof typeof pageMap] || {
        title: greeting,
        subtitle: "Bem-vindo ao app",
      }
    );
  };

  const content = getHeaderContent();

  return (
    <View className="w-full p-5">
      <View className="flex items-center justify-between flex-row">
        <View className="flex flex-col gap-1 flex-1">
          <Text
            className="text-3xl font-bold"
            style={{ color: colors?.text || "#000" }}
          >
            {content.title}
          </Text>
          <Text
            className="text-base"
            style={{ color: colors?.textSecondary || "#666" }}
          >
            {content.subtitle}
          </Text>
        </View>
        <Image
          source={require("../../assets/images/icon.png")}
          className="object-cover rounded-md"
          style={{
            width: 75,
            height: 75,
          }}
        />
      </View>
    </View>
  );
};

export default Header;
