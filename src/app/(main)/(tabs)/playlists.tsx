import CreatePlaylistModal from "@/components//playlist/creater-playlits";
import EmptyState from "@/components/empty-state";
import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import SkeletonLoadingAlbum from "@/components/loading-skeleton-album";
import { PlaylistCover } from "@/components/playlist/playlist-cover";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useTheme } from "@/context/ThemeContext";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Playlists as Playlist } from "@/types/interfaces";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import {
  ArrowRight,
  ChevronRight,
  EllipsisVertical,
  Info,
  PlusIcon,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { openSheet, closeSheet } = useBottomSheet();

  const handleOpenCreateModal = () => {
    setTitle("");
    setModalVisible((prev) => !prev);
  };

  const handleCreatePlaylist = () => {
    if (!title.trim()) {
      return Alert.alert("Campo obrigatório", "Dê um nome à sua playlist.");
    }
    handleCreaterPlaylist({
      id: Crypto.randomUUID(),
      title: title.trim(),
      songs: [],
    });
    setModalVisible(false);
    setTitle("");
  };

  const handlePlaylistDetails = (id: string) => {
    router.navigate({
      pathname: "/(main)/(pages)/details-playlist/[id]",
      params: { id: id },
    });
  };

  const getBottomSheetContent = useCallback(
    (playlist: Playlist) => {
      return (
        <View className="flex-col gap-5 px-4">
          <View className="flex-row gap-3 items-center">
            <PlaylistCover coverArt={playlist.coverArt} />
            <View className="flex-col gap-2">
              <Text className="text">{playlist.title}</Text>
              <Text className="text text-xl text-zinc-300">
                Total musicas: {playlist.songs?.length || 0}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Pressable
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.border,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: 14,
              }}
            >
              <View className="flex-row items-center gap-3">
                <Info size={20} color={colors.textMuted} />
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.text }}
                >
                  Ver detalhes
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.danger_v2,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.danger_border,
              }}
              onPress={() => {
                handleDeletePlaylist(playlist.id);
                closeSheet();
              }}
            >
              <View className="flex-row items-center gap-3">
                <Trash2 size={20} color={colors.danger_title} />
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.danger_title }}
                >
                  Deletar playlist
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    },
    [playlists, isDark, colors],
  );

  const handleOpenBottomSheet = useCallback(
    (item: Playlist) => {
      openSheet({
        snapPoints: ["20%"],
        content: () => getBottomSheetContent(item), // ← currying com item atual
      });
    },
    [openSheet, getBottomSheetContent],
  );

  // ─── Loading
  if (isLoading) {
    return (
      <LayoutWithHeader statusBarOpen={false} header={false}>
        <Header />
        <SkeletonLoadingAlbum numberOfItems={8} numColumns={2} />
      </LayoutWithHeader>
    );
  }

  // ─── Empty state
  if (playlists.length === 0) {
    return (
      <>
        <EmptyState
          variant="playlist"
          showAction={true}
          onAction={handleOpenCreateModal}
        />
        <CreatePlaylistModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={title}
          setTitle={setTitle}
          onConfirm={handleCreatePlaylist}
        />
      </>
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

  const RenderItem = ({ item }: { item: Playlist }) => (
    <View className="flex-row items-center justify-between py-2 px-4">
      {/* Left: thumbnail + info */}
      <Pressable
        className="flex-row items-center gap-4 flex-1"
        android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        onPress={() => handlePlaylistDetails(item.id)}
      >
        {/* Thumbnail */}
        <PlaylistCover coverArt={item.coverArt} />

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
        <TouchableOpacity
          hitSlop={8}
          onPress={() => handleOpenBottomSheet(item)}
        >
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
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.card,
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
