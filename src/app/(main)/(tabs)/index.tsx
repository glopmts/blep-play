import { AlbumScreen } from "@/components/album/album-card";
import Header from "@/components/header";
import { HeaderPage } from "@/components/hearder-page";
import HistoryRecentMusic from "@/components/history-recent-music";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

const Home = () => {
  const { isDark, colors } = useTheme();

  return (
    <LayoutWithHeader>
      <Header />

      <View className="mb-4">
        <HeaderPage
          title="Álbuns do Dispositivo"
          isDark={isDark}
          isAction={true}
          colors={colors}
          titleAction="Ver todos"
        />
        <AlbumScreen />
      </View>
      <View className="mb-4 p-4 flex-1">
        <HistoryRecentMusic />
      </View>
    </LayoutWithHeader>
  );
};

export default Home;
