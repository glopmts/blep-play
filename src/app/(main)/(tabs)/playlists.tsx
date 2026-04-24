import CreatePlaylistModal from "@/components/creater-playlits";
import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import SkeletonLoadingAlbum from "@/components/loading-skeleton-album";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTheme } from "@/hooks/useTheme";
import { Playlists as Playlist } from "@/types/interfaces";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ArrowRight,
  EllipsisVertical,
  ListMusicIcon,
  PlusIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NaveItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

const Playlists = () => {
  const { colors, isDark } = useTheme();
  const {
    playlists,
    isLoading,
    handleCreaterPlaylist,
    handleClearPlaylists,
    handleDeletePlaylist,
    handleRefresh,
    refreshing,
  } = usePlaylists();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] =
    useState<NaveItem["id"]>("minhas-playlists");

  const itensNavegacao: NaveItem[] = [
    { id: "minhas-playlists", label: "Minhas Playlists", icon: "🎵" },
    { id: "baixadas", label: "Baixadas", icon: "📥" },
  ];

  const handleOpenCreateModal = () => {
    setTitle("");
    setModalVisible(true);
  };

  const handleCreatePlaylist = () => {
    if (!title.trim()) {
      return Alert.alert("Campo obrigatório", "Dê um nome à sua playlist.");
    }
    handleCreaterPlaylist({ id: Crypto.randomUUID(), title: title.trim() });
    setModalVisible(false);
    setTitle("");
  };

  const handlePlaylistDetails = (id: string) => {
    router.navigate({
      pathname: "/(main)/(pages)/details-playlist/[id]",
      params: { id: id },
    });
  };

  // ─── Loading
  if (isLoading) {
    return (
      <LayoutWithHeader title="Playlists" statusBarOpen={false}>
        <SkeletonLoadingAlbum numberOfItems={8} numColumns={2} />
      </LayoutWithHeader>
    );
  }

  // ─── Empty state
  if (playlists.length === 0) {
    return (
      <LayoutWithHeader
        contentClassName="flex-1"
        header={false}
        statusBarOpen={false}
      >
        <View className="flex-1 items-center justify-center gap-5 px-8">
          {/* Icon badge */}
          <View className="w-20 h-20 rounded-3xl dark:bg-zinc-800 bg-zinc-100 items-center justify-center border dark:border-zinc-700 border-zinc-200 shadow-sm">
            <ListMusicIcon size={36} color={colors.icon} strokeWidth={1.5} />
          </View>

          <View className="items-center gap-1">
            <Text className="text-lg font-semibold dark:text-zinc-100 text-zinc-800 tracking-tight">
              Nenhuma playlist ainda
            </Text>
            <Text className="text-sm dark:text-zinc-500 text-zinc-400 text-center leading-relaxed">
              Organize suas músicas favoritas{"\n"}criando sua primeira
              playlist.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleOpenCreateModal}
            activeOpacity={0.82}
            className="flex-row items-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30"
          >
            <PlusIcon size={18} color="#fff" strokeWidth={2.5} />
            <Text className="text-white font-semibold text-sm tracking-wide">
              Criar playlist
            </Text>
          </TouchableOpacity>
        </View>

        <CreatePlaylistModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={title}
          setTitle={setTitle}
          onConfirm={handleCreatePlaylist}
        />
      </LayoutWithHeader>
    );
  }

  const TabSelector = ({
    activeTab,
    setActiveTab,
  }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
  }) => {
    const tabs = [
      { id: "minhas-playlists", label: "Minhas playlists" },
      { id: "baixadas", label: "Baixadas" },
    ];

    return (
      <View className="flex-row  bg-neutral-900 rounded-full border border-zinc-800 p-1">
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

  const RenderItem = ({ item }: { item: Playlist }) => (
    <View className="flex-row items-center justify-between py-2 px-4">
      {/* Left: thumbnail + info */}
      <Pressable
        className="flex-row items-center gap-4 flex-1"
        android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        onPress={() => handlePlaylistDetails(item.id)}
      >
        {/* Thumbnail */}
        <View
          className="w-24 h-24 rounded-2xl overflow-hidden items-center justify-center"
          style={{ backgroundColor: "#1E1E2A" }}
        >
          {item.coverArt ? (
            <Image
              source={{ uri: item.coverArt }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <ListMusicIcon size={24} color={colors.icon} strokeWidth={1.5} />
          )}
        </View>

        {/* Text info */}
        <View className="gap-0.5">
          <Text
            className="text-2xl font-semibold"
            style={{ color: "#F2F2F2" }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-sm" style={{ color: "#6B6B7A" }}>
            {item.songs?.length ?? 0} músicas
          </Text>
        </View>
      </Pressable>

      {/* Right: chevron + menu */}
      <View className="flex-row items-center gap-3">
        {/* Chevron arrow */}
        <ArrowRight size={26} color={colors.icon} strokeWidth={1.5} />
        <TouchableOpacity hitSlop={8}>
          <EllipsisVertical size={26} color={colors.icon} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── List
  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <View className="flex-1">
        <Header />
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3 gap-3">
          {/* TabSelector - ocupa espaço restante */}
          <View className="flex-1">
            <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
          </View>

          {/* Botão Add - tamanho fixo */}
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            activeOpacity={0.8}
            className="w-12 h-12 rounded-xl bg-lime-500 items-center justify-center shadow-sm"
          >
            <PlusIcon size={18} color="#fffc" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Playlist items */}
        <View
          className="flex-1"
          style={{
            backgroundColor: colors.surface_card,
            borderRadius: colors.rounded.rounded_2xl,
          }}
        >
          <FlatList
            data={activeTab === "minhas-playlists" ? playlists : []}
            keyExtractor={(_, index) => index.toString()}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerClassName="gap-4 p-4"
            showsVerticalScrollIndicator={false}
            horizontal={false}
            initialNumToRender={10}
            numColumns={1}
            maxToRenderPerBatch={5}
            renderItem={({ item: playlist, index }) => (
              <RenderItem item={playlist} key={index} />
            )}
          />
        </View>
      </View>

      <CreatePlaylistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={title}
        setTitle={setTitle}
        onConfirm={handleCreatePlaylist}
      />
    </LayoutWithHeader>
  );
};

export default Playlists;
