import { useAlbumDetails } from "@/hooks/useAlbumDetails";
import { SongWithArt } from "@/types/interfaces";
import { IMAGE_SIZE_BACKGROUND } from "@/utils/image-types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Album, Music } from "lucide-react-native";
import { memo, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type SongCardProps = {
  song: SongWithArt;
  index: number;
  isDark: boolean;
  albumTitle?: string;
};

const SongCard = memo(({ song, index, isDark, albumTitle }: SongCardProps) => {
  const formatDuration = (duration?: number) => {
    if (!duration && duration !== 0) return "--:--";
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableOpacity className="card-music">
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 8,
          overflow: "hidden",
        }}
        className="bg-zinc-400 dark:bg-zinc-700"
      >
        {song.coverArt ? (
          <Image
            source={{ uri: song.coverArt }}
            style={{ width: 50, height: 50 }}
            contentFit="cover"
            transition={100}
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Music size={20} color={isDark ? "#d4d4d8" : "#27272a"} />
          </View>
        )}
      </View>

      <View className="flex-1 ml-3">
        <Text
          className="text-base font-semibold text-black dark:text-white"
          numberOfLines={1}
        >
          {song.filename?.replace(/\.[^/.]+$/, "") || `Música ${index + 1}`}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {song.genre}
        </Text>
      </View>

      {song.duration && (
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {formatDuration(song.duration)}
        </Text>
      )}
    </TouchableOpacity>
  );
});

function Back(isDark: boolean) {
  return (
    <View
      style={{
        padding: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 50,
        position: "absolute",
        zIndex: 100,
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={isDark ? "#ffffff" : "#27272a"}
        />
      </TouchableOpacity>
    </View>
  );
}

SongCard.displayName = "SongCard";

const AlbumDetails = () => {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "album_local" | "album_artist";
  }>();

  const albumId = id as string;

  const { albumDetails, loadingDetails } = useAlbumDetails({ albumId, type });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const flatListRef = useRef<FlatList>(null);

  // Memoize o header component
  const ListHeaderComponent = useMemo(() => {
    if (!albumDetails) return null;

    return (
      <View>
        {Back(isDark)}
        <View style={{ width: "100%", height: IMAGE_SIZE_BACKGROUND }}>
          {albumDetails.coverArt ? (
            <ImageBackground
              source={{ uri: albumDetails.coverArt }}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.9)"]}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <View className="w-full h-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
              <Text className="dark:bg-zinc-700 p-8 bg-zinc-300 rounded-lg">
                <Album size={60} color={isDark ? "#ffffff" : "#27272a"} />
              </Text>
            </View>
          )}
        </View>

        <View className="px-4 mt-4 mb-2">
          <Text className="text-lg font-bold text-black dark:text-white">
            Todas as Músicas
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total: {albumDetails.assetCount}{" "}
            {albumDetails.assetCount === 1 ? "música" : "músicas"}
          </Text>
        </View>
      </View>
    );
  }, [albumDetails]);

  // Memoize renderItem
  const renderItem = useCallback(
    ({ item, index }: any) => (
      <View className="px-4">
        <SongCard
          song={item}
          index={index}
          isDark={isDark}
          albumTitle={albumDetails?.title}
        />
      </View>
    ),
    [isDark, albumDetails?.title],
  );

  // Key extractor memoizado
  const keyExtractor = useCallback((item: any) => item.id, []);

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
        ref={flatListRef}
        data={albumDetails.songs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        updateCellsBatchingPeriod={50}
        onEndReachedThreshold={0.5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
};

export default memo(AlbumDetails);
