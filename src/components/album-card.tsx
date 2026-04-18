import { Image } from "expo-image";
import { router } from "expo-router";
import { Music } from "lucide-react-native";
import React, { memo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAlbum } from "../hooks/useAlbum";
import { AlbumWithDetails } from "../types/interfaces";
import { CARD_WIDTH, IMAGE_SIZE } from "../utils/image-types";

// Componente Card
const AlbumCard = memo(
  ({
    album,
    onPress,
    isDark,
  }: {
    album: AlbumWithDetails;
    onPress: (album: AlbumWithDetails) => void;
    isDark: boolean;
  }) => {
    return (
      <TouchableOpacity
        onPress={() => onPress(album)}
        className="flex-col gap-3 items-center justify-center mb-4 p-3"
        activeOpacity={0.7}
      >
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_WIDTH,
            borderRadius: 16,
            overflow: "hidden",
          }}
          className="bg-zinc-200 dark:bg-zinc-800"
        >
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
        <View className="">
          <Text
            className="text-base font-semibold text-black dark:text-white mb-1"
            numberOfLines={1}
          >
            {album.title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {album.assetCount} {album.assetCount === 1 ? "música" : "músicas"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

AlbumCard.displayName = "AlbumCard";

interface ALlbumScreen {
  horizontal?: boolean;
  title?: string;
}

export const AlbumScreen = ({ title, horizontal = true }: ALlbumScreen) => {
  const { albums, loading, selectAlbum, refreshAlbums } = useAlbum({});
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleAlbumPress = (album: AlbumWithDetails) => {
    selectAlbum(album);
    router.navigate({
      pathname: "/details-album/[id]",
      params: { id: album.id, type: "album_local" },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator
          size="large"
          color={isDark ? "#ffffff" : "#3b82f6"}
        />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Music size={50} color={isDark ? "#d4d4d8" : "#27272a"} />
        <Text className="text-center text-gray-500 dark:text-gray-400 mt-3">
          Nenhum álbum encontrado com músicas
        </Text>
      </View>
    );
  }

  return (
    <View className="">
      {/* Lista de Álbuns */}
      <FlatList
        data={albums}
        renderItem={({ item }) => (
          <AlbumCard album={item} onPress={handleAlbumPress} isDark={isDark} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4"
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        horizontal={horizontal}
        onRefresh={refreshAlbums}
        refreshing={loading}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};
