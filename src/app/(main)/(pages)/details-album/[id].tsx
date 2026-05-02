import ActivityIndicatorCustom from "@/components/activityIndicator-Custom";
import { BackButton } from "@/components/black-button";
import SongCard from "@/components/cards/song-card";
import SearchBar from "@/components/searchBar";
import { useTheme } from "@/context/ThemeContext";
import { useAlbumDetailsLocal } from "@/hooks/albums-hooks/useAlbumDetailsLocal";
import { useDownloadCoverLocal } from "@/hooks/download-cover-local";
import { usePlayer } from "@/hooks/usePlayer";
import { useSearchSong } from "@/hooks/useSearchSong";
import { TrackDetails } from "@/types/interfaces";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Album, Download } from "lucide-react-native";
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

const AlbumDetails = () => {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { album, error, loading } = useAlbumDetailsLocal(id);
  const { isDownload, handleDownload } = useDownloadCoverLocal();

  const { playSongs, currentTrack } = usePlayer();
  const { isDark, colors } = useTheme();

  const flatListRef = useRef<FlatList>(null);
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    hasResults,
  } = useSearchSong(album?.songs || []);

  // Toca a música clicada
  const handleSongPress = useCallback(
    async (index: number) => {
      const songs = searchQuery
        ? searchResults.map((r) => r.song)
        : album?.songs;
      if (!songs || loadingSongIndex !== null) return;

      setLoadingSongIndex(index);
      try {
        await playSongs(songs, index);
        router.navigate({ pathname: "/player" });
      } finally {
        setLoadingSongIndex(null);
      }
    },
    [album?.songs, searchResults, searchQuery, playSongs, loadingSongIndex],
  );

  // Tocar álbum inteiro
  const handlePlayAll = useCallback(async () => {
    if (!album?.songs?.length) return;
    await playSongs(album.songs, 0);
    router.navigate({ pathname: "/player" });
  }, [album, playSongs]);

  const displayData = useMemo(() => {
    if (searchQuery) {
      return searchResults.map((r) => r.song);
    }
    return album?.songs || [];
  }, [searchQuery, searchResults, album?.songs]);

  const ListFooterComponent = useMemo(() => {
    if (searchQuery) return null;

    if (searchQuery || loading) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color={colors.iconActive} />
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Carregando mais músicas...
          </Text>
        </View>
      );
    }

    return null;
  }, [isDark, album?.songs?.length, searchQuery]);

  const ListHeaderComponent = useMemo(() => {
    if (!album) return null;

    return (
      <View className="relative">
        {/* Hero com imagem do álbum */}
        <View style={{ width: "100%", height: IMAGE_SIZE_BACKGROUND }}>
          {album.artworkBase64 ? (
            <ImageBackground
              source={{ uri: album.artworkBase64 }}
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
                  {album.album}
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
              {searchQuery
                ? `Resultados para "${searchQuery}"`
                : "Todas as Músicas"}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {searchQuery
                ? `${displayData.length} ${displayData.length === 1 ? "música encontrada" : "músicas encontradas"}`
                : `${album.numberOfSongs} ${album.numberOfSongs === 1 ? "música" : "músicas"}`}
            </Text>
          </View>

          {!searchQuery && (
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
          )}
        </View>

        {/*  Barra de Busca */}
        {album.songs?.length && album.songs?.length > 10 && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            onClear={clearSearch}
            colors={colors}
            placeholder="Buscar música por título, artista..."
          />
        )}
      </View>
    );
  }, [
    album,
    isDark,
    handlePlayAll,
    searchQuery,
    displayData.length,
    isSearching,
    clearSearch,
  ]);

  const renderItem = useCallback(
    ({ item, index }: { item: TrackDetails; index: number }) => {
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
            handleSongPress={() => handleSongPress(index)}
          />
        </View>
      );
    },
    [isDark, currentTrack?.id, loadingSongIndex, handleSongPress],
  );

  const keyExtractor = useCallback((item: TrackDetails) => item.id, []);

  // Estados de carregamento
  if (!album || loading) {
    return <ActivityIndicatorCustom />;
  }

  if (!album) {
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

  if (error) {
    return (
      <View className="infor-alert">
        <Text
          style={{
            color: colors.danger_title,
          }}
          className="text text-xl"
        >
          Houve um error ao carregar album: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="content p-0">
      <BackButton
        isBottomOption={true}
        onRightActionPress={() =>
          handleDownload({
            albumName: album.album,
            coverFile: album.artworkBase64 || "",
          })
        }
      >
        <View>
          {isDownload ? (
            <ActivityIndicator size={26} color={colors.iconActive} />
          ) : (
            <Download size={24} color={colors.icon} />
          )}
        </View>
      </BackButton>
      <FlatList
        data={displayData}
        ref={flatListRef}
        ListFooterComponent={ListFooterComponent}
        onEndReachedThreshold={0.3}
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
        contentContainerStyle={{ paddingBottom: 160 }}
      />
    </View>
  );
};

export default memo(AlbumDetails);
