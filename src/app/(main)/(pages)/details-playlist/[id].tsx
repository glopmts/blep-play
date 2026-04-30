import ActivityIndicatorCustom from "@/components/activityIndicator-Custom";
import { BackButton } from "@/components/black-button";
import SongCard from "@/components/cards/song-card";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { showPlatformMessage } from "@/components/toast-message-plataform";
import { useBottomSheet } from "@/context/bottom-sheet-context";
import {
  deletePlaylistImage,
  savePlaylistImage,
} from "@/database/savePlaylistImage";
import { SelectPlaylistImagePicker } from "@/hooks/use-selectImagePickerPlaylist";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTheme } from "@/hooks/useTheme";
import { updatePlaylist } from "@/services/playlists.service";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Camera, ListMusicIcon, Trash2Icon } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../../../components/ui/button";

const PlayListDetails = () => {
  const { isDark, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { playlist, isLoading, handleRefresh, handleUpdatePlaylist } =
    usePlaylists(id);
  const { playSongs, currentTrack } = usePlayer();
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const { openSheet, closeSheet } = useBottomSheet();

  const { pickImage } = SelectPlaylistImagePicker();

  // ── Toca a música clicada abrindo o player
  const handleSongPress = useCallback(
    async (index: number) => {
      if (!playlist?.songs || loadingSongIndex !== null) return;
      setLoadingSongIndex(index);
      try {
        const song = playlist.songs[index];
        await playSongs(playlist.songs, index);
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [playlist, playSongs, loadingSongIndex],
  );

  // No PlayListDetails, ao atualizar a imagem
  const handleSelectImageThumb = useCallback(async () => {
    const result = await pickImage();
    if (!result?.uri) return;

    setIsUpdatingImage(true);

    try {
      if (playlist?.customCoverArt) {
        await deletePlaylistImage(playlist.customCoverArt);
      }

      const localImagePath = await savePlaylistImage(id, result.uri);
      if (!localImagePath) {
        Alert.alert("Erro", "Não foi possível salvar a imagem");
        return;
      }

      const updated = await handleUpdatePlaylist(id, {
        customCoverArt: localImagePath,
      });

      if (updated) {
        showPlatformMessage("Capa da playlist atualizada!");
        await handleRefresh();
      } else {
        showPlatformMessage("Não foi possível atualizar a playlist");
      }
    } catch (error) {
      console.error("[handleSelectImageThumb] Erro:", error);
      Alert.alert("Erro", "Ocorreu um erro ao atualizar a imagem");
    } finally {
      setIsUpdatingImage(false);
    }
  }, [
    id,
    pickImage,
    playlist?.customCoverArt,
    handleUpdatePlaylist,
    handleRefresh,
  ]);

  // Função para remover a imagem atual
  const handleRemoveImage = useCallback(async () => {
    if (!playlist?.coverArt) return;

    Alert.alert("Remover capa", "Deseja remover a capa atual da playlist?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setIsUpdatingImage(true);
          try {
            await deletePlaylistImage(playlist.coverArt);

            const updated = await updatePlaylist(id, { coverArt: null });

            if (updated) {
              Alert.alert("Sucesso", "Capa removida!");
              handleRefresh();
            }
          } catch (error) {
            console.error("[handleRemoveImage] Erro:", error);
            Alert.alert("Erro", "Não foi possível remover a imagem");
          } finally {
            setIsUpdatingImage(false);
          }
        },
      },
    ]);
  }, [playlist?.coverArt, id, handleRefresh]);

  const handleOpenBottomSheet = useCallback(() => {
    openSheet({
      snapPoints: ["20%"],
      content: (
        <View className="flex-1 flex-row items-center gap-4 p-3">
          <Button
            label="Selecionar capa"
            icon={<Camera size={18} color="#fffc" />}
            iconPosition="left"
            variant="outline"
            onPress={handleSelectImageThumb}
            isLoading={isUpdatingImage}
            flex={1}
          />
          <Button
            label="Remover capa"
            icon={<Trash2Icon size={18} color="#fffc" />}
            iconPosition="right"
            variant="danger"
            onPress={handleRemoveImage}
            isLoading={isUpdatingImage}
          />
        </View>
      ),
    });
  }, [
    openSheet,
    handleSelectImageThumb,
    handleRemoveImage,
    isUpdatingImage,
    colors,
  ]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicatorCustom />
      </View>
    );
  }

  return (
    <LayoutWithHeader
      header={false}
      statusBarOpen={false}
      viewPaddingTop="p-0"
      variant="view"
    >
      <View className="flex-1">
        <BackButton position="absolute" isBottomOption={true}>
          <TouchableOpacity
            onPress={handleOpenBottomSheet}
            disabled={isUpdatingImage}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </BackButton>

        {playlist?.id ? (
          <View style={{ width: "100%", height: IMAGE_SIZE_BACKGROUND }}>
            {playlist?.customCoverArt && playlist?.coverArt ? (
              <ImageBackground
                source={{ uri: playlist.coverArt || playlist.customCoverArt }}
                style={{
                  flex: 1,
                  borderBottomEndRadius: 20,
                  borderBottomStartRadius: 20,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.9)"]}
                  style={StyleSheet.absoluteFill}
                />

                {/* Título sobre a imagem */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 24,
                      fontWeight: "700",
                      textShadowColor: "rgba(0,0,0,0.8)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                    numberOfLines={2}
                  >
                    {playlist.title}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View
                className="w-full h-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
                style={{
                  borderBottomEndRadius: 20,
                  borderBottomStartRadius: 20,
                }}
              >
                <TouchableOpacity
                  onPress={handleSelectImageThumb}
                  className="dark:bg-zinc-700 p-8 bg-zinc-300 rounded-2xl"
                  disabled={isUpdatingImage}
                >
                  {isUpdatingImage ? (
                    <ActivityIndicator
                      size="large"
                      color={isDark ? "#fff" : "#27272a"}
                    />
                  ) : (
                    <>
                      <ListMusicIcon
                        size={60}
                        color={isDark ? "#ffffff" : "#27272a"}
                      />
                      <Text className="text-center text-gray-500 dark:text-gray-400 mt-2">
                        Toque para adicionar capa
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text">Playlist não encontrada!</Text>
          </View>
        )}

        <View className="mt-4">
          {playlist?.songs && playlist.songs.length > 0 ? (
            playlist.songs.map((item, index) => {
              const isCurrentlyPlaying = currentTrack?.id === item.id;
              return (
                <View className="px-4" key={item.id}>
                  <SongCard
                    song={item}
                    index={index}
                    isDark={isDark}
                    isLoading={loadingSongIndex === index}
                    loadingSongIndex={loadingSongIndex}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                    loadingCovers={isLoading}
                    handleSongPress={handleSongPress}
                  />
                </View>
              );
            })
          ) : (
            <View className="flex-1 items-center justify-center mt-6">
              <Text className="text-center text-gray-500 dark:text-gray-400">
                Nenhuma música encontrada nesta playlist
              </Text>
            </View>
          )}
        </View>
      </View>
    </LayoutWithHeader>
  );
};

export default PlayListDetails;
