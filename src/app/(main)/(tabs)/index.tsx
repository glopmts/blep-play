import { AlbumScreen } from "@/components/album/album-card";
import Header from "@/components/header";
import { HeaderPage } from "@/components/hearder-page";
import HistoryRecentMusic from "@/components/history-recent-music";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const Home = () => {
  const { isDark, colors } = useTheme();

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />

      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut}
        className="flex-1"
      >
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
      </Animated.View>
    </LayoutWithHeader>
  );
};

export default Home;
