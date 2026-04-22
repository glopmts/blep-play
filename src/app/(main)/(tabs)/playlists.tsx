import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import SkeletonLoadingAlbum from "@/components/loading-skeleton-album";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTheme } from "@/hooks/useTheme";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ListMusicIcon, PlusIcon } from "lucide-react-native";
import { useState } from "react";
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

  const fillterNumberColumns = playlists.map((c) => c.songs);
  const numberColums = fillterNumberColumns.length > 1;

  // ─── List
  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <View className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
          <Text className="text-xl font-bold dark:text-zinc-100 text-zinc-900 tracking-tight">
            Playlists
          </Text>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            activeOpacity={0.8}
            className="w-9 h-9 rounded-xl bg-indigo-500 items-center justify-center shadow-sm"
          >
            <PlusIcon size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Playlist items */}
        <FlatList
          data={playlists}
          keyExtractor={(_, index) => index.toString()}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{
            justifyContent: "space-between",
            gap: 10,
          }}
          initialNumToRender={10}
          numColumns={2}
          maxToRenderPerBatch={5}
          renderItem={({ item: playlist, index }) => (
            <Pressable
              key={playlist.id}
              android_ripple={{ color: "rgba(99,102,241,0.08)" }}
              className={`flex-col items-center gap-4 px-4 py-3.5 rounded-2xl 
        dark:bg-zinc-800/70 bg-zinc-50 border dark:border-zinc-700/50 
        border-zinc-200 active:opacity-80
        ${
          index === playlists.length - 1 && playlists.length % 2 !== 0
            ? "w-[45%]" // Largura fixa para o último item ímpar
            : "flex-1"
        }`}
              onPress={() => handlePlaylistDetails(playlist.id)}
            >
              {/* Thumbnail placeholder */}
              <View className="w-40 h-40 rounded-md overflow-hidden dark:bg-zinc-700 bg-zinc-200 items-center justify-center flex-shrink-0">
                {playlist.coverArt ? (
                  <Image
                    source={{ uri: playlist.coverArt }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk" // ← cache agressivo
                  />
                ) : (
                  <ListMusicIcon
                    size={20}
                    color={colors.icon}
                    strokeWidth={1.5}
                  />
                )}
              </View>

              {/* Info */}
              <View className="flex-1 gap-0.5">
                <Text
                  className="text-sm font-semibold dark:text-zinc-100 text-zinc-800"
                  numberOfLines={1}
                >
                  {playlist.title}
                </Text>
                <Text className="text-xs dark:text-zinc-500 text-zinc-400">
                  {playlist.songs?.length ?? 0} músicas
                </Text>
              </View>
            </Pressable>
          )}
        />
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

// ─── Create Playlist Modal
interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  onConfirm: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  title,
  setTitle,
  onConfirm,
}) => (
  <Modal visible={visible} onClose={onClose} title="Nova playlist">
    <View className="gap-4">
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder="Nome da playlist"
        maxLength={30}
      />

      <View className="flex-row gap-3 mt-1">
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          className="flex-1 py-3.5 rounded-xl border dark:border-zinc-700 border-zinc-200 items-center"
        >
          <Text className="text-sm font-medium dark:text-zinc-400 text-zinc-500">
            Cancelar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          activeOpacity={0.82}
          className="flex-1 py-3.5 rounded-xl bg-indigo-500 items-center shadow-sm shadow-indigo-500/30"
        >
          <Text className="text-sm font-semibold text-white">Criar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default Playlists;
