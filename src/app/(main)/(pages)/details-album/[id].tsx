import { BackButton } from "@/components/black-button";
import SongCard from "@/components/cards/song-card";
import { useAlbumDetails } from "@/hooks/useAlbumDetails";
import { usePlayer } from "@/hooks/usePlayer";
import { useTheme } from "@/hooks/useTheme";
import { SongWithArt } from "@/types/interfaces";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Album } from "lucide-react-native";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

SongCard.displayName = "SongCard";

// Tela principal
const AlbumDetails = () => {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "album_local" | "album_artist";
  }>();

  const {
    albumDetails,
    loadingDetails,
    loadingCovers,
    hasMore,
    loadMoreSongs,
    loadingMore,
    totalSongsCount,
  } = useAlbumDetails({
    albumId: id as string,
    type,
  });

  const { playSongs, currentTrack } = usePlayer();
  const { isDark, colors } = useTheme();

  const flatListRef = useRef<FlatList>(null);
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);

  // ── Toca a música clicada abrindo o player
  const handleSongPress = useCallback(
    async (index: number) => {
      if (!albumDetails?.songs || loadingSongIndex !== null) return; // bloqueia
      setLoadingSongIndex(index);
      try {
        await playSongs(albumDetails.songs, index);
        router.navigate({
          pathname: "/player",
        });
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [albumDetails, playSongs, loadingSongIndex],
  );

  // ── Tocar álbum inteiro
  const handlePlayAll = useCallback(async () => {
    if (!albumDetails?.songs?.length) return;
    await playSongs(albumDetails.songs, 0);
    router.navigate({
      pathname: "/player",
    });
  }, [albumDetails, playSongs]);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore && albumDetails && albumDetails?.songs?.length > 0) {
      return (
        <View className="py-8 items-center">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            {totalSongsCount} {totalSongsCount === 1 ? "música" : "músicas"} no
            álbum
          </Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color={isDark ? "#fff" : "#3b82f6"} />
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Carregando mais músicas...
          </Text>
        </View>
      );
    }

    return null;
  }, [
    loadingMore,
    hasMore,
    isDark,
    totalSongsCount,
    albumDetails?.songs?.length,
  ]);

  // ── Header
  const ListHeaderComponent = useMemo(() => {
    if (!albumDetails) return null;

    return (
      <View>
        <BackButton isDark={isDark} />

        {/* Hero */}
        <View style={{ width: "100%", height: IMAGE_SIZE_BACKGROUND }}>
          {albumDetails.coverArt ? (
            <ImageBackground
              source={{ uri: albumDetails.coverArt }}
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
                  {albumDetails.title}
                </Text>
              </View>
            </ImageBackground>
          ) : (
            <View className="w-full h-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
              <View className="dark:bg-zinc-700 p-8 bg-zinc-300 rounded-2xl">
                <Album size={60} color={isDark ? "#ffffff" : "#27272a"} />
              </View>
            </View>
          )}
        </View>

        {/* Info + Play all */}
        <View className="px-4 mt-4 mb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-black dark:text-white">
              Todas as Músicas
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {albumDetails.assetCount}{" "}
              {albumDetails.assetCount === 1 ? "música" : "músicas"}
            </Text>
          </View>

          {/* Botão Tocar tudo */}
          <TouchableOpacity
            onPress={handlePlayAll}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#3b82f6",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <Ionicons name="play" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Tocar tudo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [albumDetails, isDark, handlePlayAll]);

  // ── renderItem
  const renderItem = useCallback(
    ({ item, index }: { item: SongWithArt; index: number }) => {
      const isCurrentlyPlaying = currentTrack?.id === item.id;
      return (
        <View className="px-4">
          <SongCard
            song={item}
            index={index}
            isDark={isDark}
            isLoading={loadingSongIndex === index}
            loadingSongIndex={loadingSongIndex}
            isCurrentlyPlaying={isCurrentlyPlaying}
            loadingCovers={loadingCovers}
            handleSongPress={handleSongPress}
          />
        </View>
      );
    },
    [isDark, currentTrack, handleSongPress],
  );

  const keyExtractor = useCallback((item: SongWithArt) => item.id, []);

  // ── Estados de carregamento / erro
  if (loadingDetails && !albumDetails) {
    return (
      <View className="infor-alert">
        <ActivityIndicator
          size="large"
          color={isDark ? "#ffffff" : "#3b82f6"}
        />
      </View>
    );
  }

  if (!albumDetails) {
    return (
      <View className="infor-alert">
        <Text className="text-1">Álbum não encontrado</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="content p-0">
      <FlatList
        data={albumDetails?.songs || []}
        ref={flatListRef}
        ListFooterComponent={ListFooterComponent}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            loadMoreSongs();
          }
        }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        updateCellsBatchingPeriod={50}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={{ paddingBottom: 160 }} // espaço pro MiniPlayer
      />
    </View>
  );
};

export default memo(AlbumDetails);
