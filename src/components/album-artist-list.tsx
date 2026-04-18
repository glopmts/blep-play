import { useAlbumsGrouped } from "@/hooks/useAlbumsGrouped";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import { memo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { GroupedAlbum } from "../types/interfaces";
import { IMAGE_SIZE } from "../utils/image-types";

const AlbumCard = memo(({ album, onPress, isDark }: any) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(album)}
      className="flex-col gap-3 items-center justify-center mb-4 p-3 rounded-lg"
      activeOpacity={0.7}
    >
      <View className="relative w-40 h-40 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        {album.coverArt ? (
          <Image
            source={{ uri: album.coverArt }}
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            contentFit="cover"
            transition={100}
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Music size={30} color={isDark ? "#d4d4d8" : "#27272a"} />
          </View>
        )}
      </View>

      <View className="items-center">
        <Text
          className="text-base font-semibold text-black dark:text-white mb-1 text-center"
          numberOfLines={1}
        >
          {album.title}
        </Text>
        <Text
          className="text-sm text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {album.artistName}
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {album.assetCount} {album.assetCount === 1 ? "música" : "músicas"}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

AlbumCard.displayName = "AlbumCard";

export const AlbumsList = () => {
  const { albums, loading, refreshAlbums } = useAlbumsGrouped();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleAlbumPress = (album: GroupedAlbum) => {
    router.navigate({
      pathname: "/details-album/[id]",
      params: {
        id: album.id, // ex: "sabrina_carpenter__sabrina_carpenter"
        artistName: album.artistName,
        albumTitle: album.title,
        type: "album_artist",
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center dark:bg-zinc-900">
        <ActivityIndicator
          size="large"
          color={isDark ? "#ffffff" : "#3b82f6"}
        />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-5 dark:bg-zinc-900">
        <Music size={50} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="text-center text-gray-500 dark:text-gray-400 mt-3">
          Nenhum álbum encontrado
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={albums}
      renderItem={({ item }) => (
        <AlbumCard album={item} onPress={handleAlbumPress} isDark={isDark} />
      )}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerClassName="p-4"
      horizontal={false}
      numColumns={2}
      onRefresh={refreshAlbums}
      refreshing={loading}
    />
  );
};
