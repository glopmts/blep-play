import AlbumScreen from "@/components/albums/album-screen";
import Header from "@/components/header";
import { HeaderPage } from "@/components/hearder-page";
import HistoryRecentMusic from "@/components/history-recent-music";
import AllMusicList from "@/components/home-tabs/all-music-list";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const tabs = [
    { id: "home", label: "Pagina Inicial" },
    { id: "folders", label: "Pasta Local" },
    { id: "musics", label: "Lista musicas" },
  ];

  return (
    <View className="flex-row bg-neutral-900 rounded-full border border-zinc-800 p-1">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => setActiveTab(tab.id)}
          className="flex-1 rounded-full"
          style={{
            backgroundColor: activeTab === tab.id ? "#84cc16" : "transparent",
            paddingVertical: 12, // Altura consistente
          }}
        >
          <View className="justify-center items-center">
            <Text
              className={`font-medium text-base ${
                activeTab === tab.id ? "text-black" : "text-zinc-300"
              }`}
            >
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const Home = () => {
  const { isDark, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<NaveItem["id"]>("home");

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />

      <View className="px-3">
        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>

      {activeTab === "home" ? (
        <View className="flex-1">
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
        </View>
      ) : activeTab === "folders" ? (
        <View className="flex-1">
          <Text>pastas</Text>
        </View>
      ) : (
        <AllMusicList />
      )}
    </LayoutWithHeader>
  );
};

export default Home;
