import AlbumScreen from "@/components/albums/album-screen";
import Header from "@/components/header";
import { HeaderPage } from "@/components/hearder-page";
import HistoryRecentMusic from "@/components/history-recent-music";
import AllMusicList from "@/components/home-tabs/all-music-list";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { TFunction } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

const TabSelector = ({
  activeTab,
  t,
  setActiveTab,
}: {
  activeTab: string;
  t: TFunction;
  setActiveTab: (tab: string) => void;
}) => {
  const tabs = [
    { id: "home", label: t("tabs.tabsselector.label1") },
    { id: "musics", label: t("tabs.tabsselector.label2") },
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
  const { t } = useTranslation();

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />

      <View className="px-3">
        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
      </View>

      {activeTab === "home" ? (
        <View className="flex-1">
          <View className="mb-4">
            <HeaderPage
              title={t("text.feedback.albumtitlehome")}
              isDark={isDark}
              isAction={true}
              colors={colors}
              titleAction={t("text.feedback.seeall")}
            />
            <AlbumScreen />
          </View>
          <View className="mb-4 p-4 flex-1">
            <HistoryRecentMusic />
          </View>
        </View>
      ) : (
        <AllMusicList />
      )}
    </LayoutWithHeader>
  );
};

export default Home;
